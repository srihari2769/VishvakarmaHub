import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// GET — get participant's dashboard data
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const challenge = await prisma.vSCChallenge.findFirst({
      where: { isActive: true },
    });
    if (!challenge) return errorResponse('No active challenge', 404);

    // Get latest attempt participant
    const participant = await prisma.vSCParticipant.findFirst({
      where: { userId: decoded.userId, challengeId: challenge.id },
      orderBy: { attemptNumber: 'desc' },
      include: {
        attempts: {
          include: {
            round: {
              select: { roundNumber: true, title: true, roundType: true, timeLimit: true, passingPercent: true },
            },
          },
          orderBy: { round: { roundNumber: 'asc' } },
        },
        powerUps: true,
        certificates: {
          select: { id: true, type: true, rank: true, totalScore: true, roundsCompleted: true, certificateUrl: true, issuedAt: true },
        },
      },
    });

    if (!participant) return errorResponse('Not registered', 404);

    // Get leaderboard (top 20)
    const leaderboard = await prisma.vSCParticipant.findMany({
      where: { challengeId: challenge.id, paymentStatus: 'PAID' },
      orderBy: [{ totalScore: 'desc' }, { createdAt: 'asc' }],
      take: 20,
      select: {
        id: true,
        name: true,
        totalScore: true,
        currentRound: true,
        isEliminated: true,
        isBoosted: true,
        rank: true,
        college: true,
        city: true,
      },
    });

    // Stats
    const totalParticipants = await prisma.vSCParticipant.count({
      where: { challengeId: challenge.id, paymentStatus: 'PAID' },
    });
    const activeParticipants = await prisma.vSCParticipant.count({
      where: { challengeId: challenge.id, paymentStatus: 'PAID', isEliminated: false },
    });

    return successResponse({
      participant,
      leaderboard,
      stats: { totalParticipants: totalParticipants + (challenge.manualRegistrations || 0), activeParticipants },
      challenge: {
        id: challenge.id,
        name: challenge.name,
        skipRoundPrice: challenge.skipRoundPrice,
        extraTimePrice: challenge.extraTimePrice,
        revivePrice: challenge.revivePrice,
        leaderboardBoostPrice: challenge.leaderboardBoostPrice,
      },
    });
  } catch (error) {
    console.error('VSC participant error:', error);
    return errorResponse('Failed to fetch participant data', 500);
  }
}
