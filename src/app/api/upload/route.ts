import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyToken } from '@/lib/auth';
import { errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

// Use lightweight REST API calls instead of heavy googleapis package
// This avoids cold-start timeouts on Vercel serverless functions

async function getGoogleAccessToken(): Promise<{ token: string | null; error?: string }> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    return { token: null, error: `Credentials missing: email=${!!email}, key=${!!privateKey}` };
  }

  // Handle both escaped \\n and literal \n in private key
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  // Strip surrounding quotes if present
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const jwtToken = jwt.sign(
      {
        iss: email,
        scope: 'https://www.googleapis.com/auth/drive.file',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      },
      privateKey,
      { algorithm: 'RS256' }
    );

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return { token: null, error: `OAuth exchange failed: ${tokenData.error || tokenData.error_description || JSON.stringify(tokenData)}` };
    }

    return { token: tokenData.access_token };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { token: null, error: `JWT sign error: ${msg}` };
  }
}

async function uploadToGoogleDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string,
  accessToken: string
) {
  const metadata = { name: fileName, parents: [folderId] };
  const boundary = '----VishvakarmaUploadBoundary';

  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaPart = `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;
  const closePart = `\r\n--${boundary}--`;

  const body = Buffer.concat([
    Buffer.from(metaPart),
    Buffer.from(mediaPart),
    Buffer.from(buffer.toString('base64')),
    Buffer.from(closePart),
  ]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    console.error('Google Drive upload HTTP error:', res.status, errBody);
    return null;
  }

  return res.json();
}

async function setFilePublic(fileId: string, accessToken: string) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }
  );

  if (!res.ok) {
    console.error('Failed to set file public:', res.status, await res.text());
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    try {
      verifyToken(token);
    } catch {
      return errorResponse('Session expired. Please log in again.', 401);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return errorResponse('File size exceeds 10MB limit', 400);
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('File type not allowed. Use images (JPEG, PNG, GIF, WebP, SVG) or PDF.', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try Google Drive upload
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const authResult = await getGoogleAccessToken();

    if (!folderId) {
      console.error('GOOGLE_DRIVE_FOLDER_ID not set');
      return errorResponse('File storage is not configured (missing folder ID).', 503);
    }

    if (!authResult.token) {
      return errorResponse(`File storage auth failed: ${authResult.error}`, 503);
    }

    const accessToken = authResult.token;

    {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${timestamp}_${safeName}`;

      const driveFile = await uploadToGoogleDrive(buffer, fileName, file.type, folderId, accessToken);

      if (!driveFile?.id) {
        console.error('Drive upload returned no file ID:', driveFile);
        return errorResponse('File upload to storage failed. Please try again.', 500);
      }

      // Make file publicly readable
      await setFilePublic(driveFile.id, accessToken);

      // Build public URL
      const isImage = file.type.startsWith('image/');
      const publicUrl = isImage
        ? `https://drive.google.com/thumbnail?id=${driveFile.id}&sz=w1000`
        : `https://drive.google.com/uc?export=download&id=${driveFile.id}`;

      return NextResponse.json({
        success: true,
        data: {
          url: publicUrl,
          driveFileId: driveFile.id,
          viewLink: driveFile.webViewLink,
          format: file.type.split('/')[1],
          size: file.size,
        },
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return errorResponse(`Upload failed: ${message}`, 500);
  }
}
