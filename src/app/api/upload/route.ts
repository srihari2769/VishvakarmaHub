import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from '@/lib/auth';
import { errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 60;

function getS3Client() {
  const region = process.env.AWS_REGION?.trim() || 'ap-south-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
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

    const uploadType = formData.get('type') as string | null;
    const isVideo = uploadType === 'video' || file.type.startsWith('video/');

    // Validate file size (10MB for images/docs, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse(`File size exceeds ${isVideo ? '50MB' : '10MB'} limit`, 400);
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    ];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('File type not allowed. Use images (JPEG, PNG, GIF, WebP, SVG), PDF, or video (MP4, WebM, MOV, AVI).', 400);
    }

    // Try S3 first, fallback to Vercel Blob
    const s3 = getS3Client();
    const bucket = process.env.AWS_S3_BUCKET?.trim();

    if (s3 && bucket) {
      // Upload to S3
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `uploads/${timestamp}_${safeName}`;

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }));

      const region = process.env.AWS_REGION?.trim() || 'ap-south-1';
      const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

      return NextResponse.json({
        success: true,
        data: { url: publicUrl, key, format: file.type.split('/')[1], size: file.size },
      });
    }

    // Fallback: Upload to Vercel Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return errorResponse('File storage is not configured. Please set up AWS S3 or Vercel Blob.', 503);
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `uploads/${timestamp}_${safeName}`;

    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      data: { url: blob.url, key: pathname, format: file.type.split('/')[1], size: file.size },
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return errorResponse(`Upload failed: ${message}`, 500);
  }
}
