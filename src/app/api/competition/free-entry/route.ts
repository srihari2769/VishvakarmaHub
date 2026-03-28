import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

// GET - Get free entry dashboard data
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);

    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, tagline: true, studentFee: true, founderFee: true, pageContent: true },
    });
    if (!competition) return errorResponse('No active competition', 404);

    const freeEntry = await prisma.freeEntry.findUnique({
      where: { userId_competitionId: { userId: payload.userId, competitionId: competition.id } },
      include: {
        referrals: {
          include: {
            referredUser: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: { firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    if (!freeEntry) return errorResponse('No free entry found', 404);

    // Count verified referrals (those who actually paid)
    const verifiedReferrals = freeEntry.referrals.filter((r) => r.paymentVerified).length;

    return successResponse({
      freeEntry,
      competition,
      verifiedReferrals,
      totalReferrals: freeEntry.referrals.length,
    });
  } catch (error) {
    console.error('Free entry dashboard error:', error);
    return errorResponse('Failed to load dashboard', 500);
  }
}

// PATCH - Submit video / Update free entry
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    const body = await request.json();
    const { action } = body;

    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
    });
    if (!competition) return errorResponse('No active competition', 404);

    const freeEntry = await prisma.freeEntry.findUnique({
      where: { userId_competitionId: { userId: payload.userId, competitionId: competition.id } },
    });
    if (!freeEntry) return errorResponse('No free entry found', 404);

    switch (action) {
      case 'submit-video': {
        const { videoUrl, videoPlatform, videoDescription } = body;

        if (!videoUrl || !videoPlatform) {
          return errorResponse('Video URL and platform are required', 400);
        }

        // Basic URL validation
        try {
          new URL(videoUrl);
        } catch {
          return errorResponse('Invalid video URL', 400);
        }

        const allowedPlatforms = ['INSTAGRAM', 'YOUTUBE', 'TWITTER', 'LINKEDIN', 'FACEBOOK', 'OTHER'];
        if (!allowedPlatforms.includes(videoPlatform)) {
          return errorResponse('Invalid video platform', 400);
        }

        const updated = await prisma.freeEntry.update({
          where: { id: freeEntry.id },
          data: {
            videoUrl,
            videoPlatform,
            videoDescription: videoDescription || null,
            videoStatus: 'PENDING',
            status: 'VIDEO_SUBMITTED',
          },
        });

        return successResponse(updated);
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Free entry update error:', error);
    return errorResponse('Update failed', 500);
  }
}
