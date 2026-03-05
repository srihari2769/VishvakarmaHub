import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { errorResponse, getTokenFromRequest } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);

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

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (cloudName && uploadPreset) {
      // Upload to Cloudinary
      const cloudinaryForm = new FormData();
      cloudinaryForm.append('file', file);
      cloudinaryForm.append('upload_preset', uploadPreset);
      cloudinaryForm.append('folder', `vishvakarmahub/${payload.userId}`);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: cloudinaryForm }
      );

      const cloudData = await cloudRes.json();

      if (cloudData.secure_url) {
        return NextResponse.json({
          success: true,
          data: {
            url: cloudData.secure_url,
            publicId: cloudData.public_id,
            format: cloudData.format,
            size: cloudData.bytes,
          },
        });
      } else {
        console.error('Cloudinary upload error:', cloudData);
        return errorResponse('Upload to cloud storage failed', 500);
      }
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
