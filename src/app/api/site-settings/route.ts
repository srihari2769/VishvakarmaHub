import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// GET - anyone can check coming soon status; admins get full settings
export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 'global', comingSoon: false },
      });
    }

    // Check if admin — if so, include Razorpay key info
    const token = getTokenFromRequest(request);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.role === 'ADMIN') {
        return successResponse({
          comingSoon: settings.comingSoon,
          razorpayKeyId: settings.razorpayKeyId || '',
          razorpayKeySecret: settings.razorpayKeySecret ? '••••' + settings.razorpayKeySecret.slice(-4) : '',
          hasRazorpayKeys: !!(settings.razorpayKeyId && settings.razorpayKeySecret),
        });
      }
    }

    return successResponse({ comingSoon: settings.comingSoon });
  } catch (error) {
    console.error('Site settings fetch error:', error);
    return errorResponse('Failed to fetch site settings', 500);
  }
}

// PATCH - admin only
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403);
    }

    const body = await request.json();
    const { comingSoon, razorpayKeyId, razorpayKeySecret } = body;

    const updateData: Record<string, unknown> = {};

    if (typeof comingSoon === 'boolean') {
      updateData.comingSoon = comingSoon;
    }

    if (typeof razorpayKeyId === 'string') {
      updateData.razorpayKeyId = razorpayKeyId.trim();
    }

    if (typeof razorpayKeySecret === 'string' && razorpayKeySecret.trim() && !razorpayKeySecret.startsWith('••••')) {
      updateData.razorpayKeySecret = razorpayKeySecret.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'global' },
      update: updateData,
      create: { id: 'global', comingSoon: false, ...updateData },
    });

    return successResponse({
      comingSoon: settings.comingSoon,
      razorpayKeyId: settings.razorpayKeyId || '',
      razorpayKeySecret: settings.razorpayKeySecret ? '••••' + settings.razorpayKeySecret.slice(-4) : '',
      hasRazorpayKeys: !!(settings.razorpayKeyId && settings.razorpayKeySecret),
    });
  } catch (error) {
    console.error('Site settings update error:', error);
    return errorResponse('Failed to update site settings', 500);
  }
}
