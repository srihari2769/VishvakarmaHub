import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { errorResponse, getTokenFromRequest } from '@/lib/utils';
import { google } from 'googleapis';
import { Readable } from 'stream';

function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !key) return null;

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
}

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    verifyToken(token);

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

    const auth = getGoogleAuth();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (auth && folderId) {
      // Upload to Google Drive
      const drive = google.drive({ version: 'v3', auth });
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${timestamp}_${safeName}`;

      // Upload file
      const driveResponse = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType: file.type,
          body: bufferToStream(buffer),
        },
        fields: 'id, name, webViewLink, webContentLink',
      });

      const fileId = driveResponse.data.id;

      if (!fileId) {
        return errorResponse('Google Drive upload failed', 500);
      }

      // Make file publicly readable
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Get the direct link for images / download link for PDFs
      const isImage = file.type.startsWith('image/');
      const publicUrl = isImage
        ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
        : `https://drive.google.com/uc?export=download&id=${fileId}`;

      return NextResponse.json({
        success: true,
        data: {
          url: publicUrl,
          driveFileId: fileId,
          viewLink: driveResponse.data.webViewLink,
          format: file.type.split('/')[1],
          size: file.size,
        },
      });
    }

    // Fallback: Convert to base64 data URL (works without external services)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      data: {
        url: dataUrl,
        format: file.type.split('/')[1],
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('Upload failed', 500);
  }
}
