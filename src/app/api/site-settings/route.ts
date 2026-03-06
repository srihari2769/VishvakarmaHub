import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// GET - anyone can check coming soon status
export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'global' } });
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 'global', comingSoon: false },
      });
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
    const { comingSoon } = body;

    if (typeof comingSoon !== 'boolean') {
      return errorResponse('comingSoon must be a boolean', 400);
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'global' },
      update: { comingSoon },
      create: { id: 'global', comingSoon },
    });

    return successResponse({ comingSoon: settings.comingSoon });
  } catch (error) {
    console.error('Site settings update error:', error);
    return errorResponse('Failed to update site settings', 500);
  }
}
