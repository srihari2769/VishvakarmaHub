import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

// POST /api/startups/[slug]/save — Toggle save/unsave a startup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { slug } = await params;

    const startup = await prisma.startup.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!startup) return errorResponse('Startup not found', 404);

    // Check if already saved
    const existing = await prisma.savedStartup.findUnique({
      where: {
        userId_startupId: {
          userId: decoded.userId,
          startupId: startup.id,
        },
      },
    });

    if (existing) {
      // Unsave
      await prisma.savedStartup.delete({ where: { id: existing.id } });
      return successResponse({ saved: false });
    } else {
      // Save
      await prisma.savedStartup.create({
        data: {
          userId: decoded.userId,
          startupId: startup.id,
        },
      });
      return successResponse({ saved: true });
    }
  } catch (error) {
    console.error('Save startup error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// GET /api/startups/[slug]/save — Check if current user has saved this startup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return successResponse({ saved: false });

    const decoded = verifyToken(token);
    if (!decoded) return successResponse({ saved: false });

    const { slug } = await params;

    const startup = await prisma.startup.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!startup) return errorResponse('Startup not found', 404);

    const existing = await prisma.savedStartup.findUnique({
      where: {
        userId_startupId: {
          userId: decoded.userId,
          startupId: startup.id,
        },
      },
    });

    return successResponse({ saved: !!existing });
  } catch (error) {
    console.error('Check save status error:', error);
    return errorResponse('Internal server error', 500);
  }
}
