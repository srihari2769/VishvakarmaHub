import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import crypto from 'crypto';

export const maxDuration = 30;

function generateReferralCode(): string {
  return 'VH-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET /api/referrals — get current user's referral info
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        referralCode: true,
        referralCount: true,
        isVerified: true,
        startups: {
          where: { isFeatured: true },
          select: { id: true, title: true },
        },
      },
    });

    if (!user) return errorResponse('User not found', 404);

    // Generate referral code if not exists
    let referralCode = user.referralCode;
    if (!referralCode) {
      // Generate unique code with retry
      for (let i = 0; i < 5; i++) {
        const code = generateReferralCode();
        const exists = await prisma.user.findUnique({ where: { referralCode: code } });
        if (!exists) {
          referralCode = code;
          break;
        }
      }
      if (referralCode) {
        await prisma.user.update({
          where: { id: payload.userId },
          data: { referralCode },
        });
      }
    }

    // Get list of referred users
    const referredUsers = await prisma.user.findMany({
      where: { referredBy: referralCode },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({
      referralCode,
      referralCount: user.referralCount,
      isVerified: user.isVerified,
      hasFeaturedStartup: user.startups.length > 0,
      referredUsers,
      rewards: {
        featuredSlotUnlocked: user.referralCount >= 1,
        verifiedBadgeUnlocked: user.referralCount >= 5,
      },
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/referrals — claim a reward (featured slot or verified badge)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const payload = verifyToken(token);

    const body = await request.json();
    const { reward, startupId } = body;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { referralCount: true, isVerified: true },
    });

    if (!user) return errorResponse('User not found', 404);

    if (reward === 'featured') {
      if (user.referralCount < 1) {
        return errorResponse('You need at least 1 referral to claim a featured slot', 400);
      }
      if (!startupId) {
        return errorResponse('Please select a startup to feature', 400);
      }

      // Verify the startup belongs to this user
      const startup = await prisma.startup.findFirst({
        where: { id: startupId, founderId: payload.userId },
      });
      if (!startup) return errorResponse('Startup not found or not yours', 404);

      await prisma.startup.update({
        where: { id: startupId },
        data: { isFeatured: true },
      });

      return successResponse({ message: 'Startup marked as featured!' });
    }

    if (reward === 'verified') {
      if (user.referralCount < 5) {
        return errorResponse('You need at least 5 referrals for the verified badge', 400);
      }
      if (user.isVerified) {
        return errorResponse('You already have the verified badge', 400);
      }

      await prisma.user.update({
        where: { id: payload.userId },
        data: { isVerified: true },
      });

      return successResponse({ message: 'Verified badge unlocked!' });
    }

    return errorResponse('Invalid reward type', 400);
  } catch (error) {
    console.error('Claim referral reward error:', error);
    return errorResponse('Internal server error', 500);
  }
}
