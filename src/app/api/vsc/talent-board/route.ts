import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 15;

// GET — public talent board
export async function GET() {
  try {
    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    const talents = await prisma.vSCParticipant.findMany({
      where: {
        challengeId: challenge.id,
        showOnTalentBoard: true,
      },
      include: {
        attempts: {
          where: { completedAt: { not: null } },
          select: { score: true, maxScore: true },
        },
      },
      orderBy: { totalScore: 'desc' },
      take: 50,
    });

    const board = talents.map((t, i) => {
      const totalScore = t.attempts.reduce((s, a) => s + (a.score || 0), 0);
      const maxScore = t.attempts.reduce((s, a) => s + (a.maxScore || 100), 0);
      return {
        rank: i + 1,
        name: t.name,
        currentRound: t.currentRound,
        totalScore,
        accuracy: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        roundsCompleted: t.attempts.length,
        isEliminated: t.isEliminated,
      };
    });

    return successResponse({
      talents: board,
      challengeTitle: challenge.name,
      recruiterPrice: 2999,
    });
  } catch (error) {
    console.error('Talent board error:', error);
    return errorResponse('Failed', 500);
  }
}

// POST — toggle showOnTalentBoard
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    const participant = await prisma.vSCParticipant.findFirst({
      where: { userId: decoded.userId, challengeId: challenge.id },
    });
    if (!participant) return errorResponse('Not a participant', 404);

    const updated = await prisma.vSCParticipant.update({
      where: { id: participant.id },
      data: { showOnTalentBoard: !participant.showOnTalentBoard },
    });

    return successResponse({
      showOnTalentBoard: updated.showOnTalentBoard,
      message: updated.showOnTalentBoard ? 'You are now visible on the Talent Board!' : 'Removed from Talent Board',
    });
  } catch (error) {
    console.error('Talent board toggle error:', error);
    return errorResponse('Failed', 500);
  }
}
