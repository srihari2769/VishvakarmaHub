import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// GET — get leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    // Global leaderboard
    if (!roundId) {
      const participants = await prisma.vSCParticipant.findMany({
        where: { challengeId: challenge.id, paymentStatus: 'PAID' },
        orderBy: [{ totalScore: 'desc' }, { createdAt: 'asc' }],
        take: 100,
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

      // Check if requester is logged in — include their rank
      let myRank = null;
      const token = getTokenFromRequest(request);
      if (token) {
        try {
          const decoded = verifyToken(token);
          const me = await prisma.vSCParticipant.findFirst({
            where: { userId: decoded.userId, challengeId: challenge.id },
            orderBy: { attemptNumber: 'desc' },
          });
          if (me) {
            const above = await prisma.vSCParticipant.count({
              where: {
                challengeId: challenge.id,
                paymentStatus: 'PAID',
                totalScore: { gt: me.totalScore },
              },
            });
            myRank = { ...me, rank: above + 1 };
          }
        } catch { /* not logged in */ }
      }

      return successResponse({ leaderboard: participants, myRank, total: participants.length + (challenge.manualRegistrations || 0) });
    }

    // Round-specific leaderboard
    const attempts = await prisma.vSCRoundAttempt.findMany({
      where: { roundId, completedAt: { not: null } },
      orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }],
      take: 100,
      select: {
        id: true,
        score: true,
        maxScore: true,
        percentage: true,
        timeTaken: true,
        passed: true,
        participant: {
          select: { name: true, college: true, city: true, isBoosted: true },
        },
      },
    });

    return successResponse({ leaderboard: attempts });
  } catch (error) {
    console.error('VSC leaderboard error:', error);
    return errorResponse('Failed to fetch leaderboard', 500);
  }
}
