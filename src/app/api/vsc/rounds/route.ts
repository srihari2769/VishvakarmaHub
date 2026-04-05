import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export const maxDuration = 30;

// GET — get round questions for a participant (randomized)
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');
    const roundNumber = searchParams.get('roundNumber');
    if (!roundId && !roundNumber) return errorResponse('Round ID or round number required', 400);

    // Check participant first to get challenge
    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    let round;
    if (roundId) {
      round = await prisma.vSCRound.findUnique({ where: { id: roundId } });
    } else {
      round = await prisma.vSCRound.findFirst({
        where: { challengeId: challenge.id, roundNumber: parseInt(roundNumber!) },
      });
    }
    if (!round) return errorResponse('Round not found', 404);
    if (!round.isActive || round.isLocked) return errorResponse('Round is not active', 403);

    const participant = await prisma.vSCParticipant.findFirst({
      where: { userId: decoded.userId, challengeId: challenge.id, paymentStatus: 'PAID', isEliminated: false },
      orderBy: { attemptNumber: 'desc' },
    });
    if (!participant) return errorResponse('Not eligible', 403);

    if (participant.currentRound > round.roundNumber) {
      return errorResponse('You have already completed this round', 400);
    }
    if (participant.currentRound < round.roundNumber) {
      return errorResponse('Complete previous rounds first', 400);
    }

    // Check existing attempt
    let attempt = await prisma.vSCRoundAttempt.findUnique({
      where: { participantId_roundId: { participantId: participant.id, roundId: round.id } },
    });

    if (attempt?.completedAt) {
      return errorResponse('Round already completed', 400);
    }

    // For quiz-type rounds, randomize questions per user
    if (['SPEED_IQ', 'DECISION_MAKING', 'PRESSURE'].includes(round.roundType) && round.questionPool) {
      const pool = round.questionPool as Array<Record<string, unknown>>;

      if (!attempt) {
        // Seed-based shuffle using hash of participantId + roundId
        const seed = crypto.createHash('sha256').update(participant.id + round.id).digest('hex');
        const shuffled = seededShuffle([...pool], seed);
        const assigned = shuffled.slice(0, Math.min(20, pool.length));

        attempt = await prisma.vSCRoundAttempt.create({
          data: {
            userId: decoded.userId,
            participantId: participant.id,
            roundId: round.id,
            assignedQuestions: assigned.map(q => ({ ...q, correctAnswer: undefined })),
            maxScore: assigned.reduce((s, q) => s + ((q.points as number) || 10), 0),
            startedAt: new Date(),
          },
        });

        // Return questions without correct answers
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const questions = assigned.map(({ correctAnswer, ...q }) => q);
        return successResponse({
          attempt: { id: attempt.id, startedAt: attempt.startedAt },
          questions,
          timeLimit: round.timeLimit + (attempt.usedExtraTime ? 120 : 0),
          roundType: round.roundType,
          round: { id: round.id, title: round.title, roundNumber: round.roundNumber },
        });
      }

      // Return existing assigned questions (without answers)
      const assignedQs = attempt.assignedQuestions as Array<Record<string, unknown>>;
      return successResponse({
        attempt: { id: attempt.id, startedAt: attempt.startedAt },
        questions: assignedQs,
        timeLimit: round.timeLimit + (attempt.usedExtraTime ? 120 : 0),
        roundType: round.roundType,
        round: { id: round.id, title: round.title, roundNumber: round.roundNumber },
      });
    }

    // For text/creative/video rounds
    if (!attempt) {
      attempt = await prisma.vSCRoundAttempt.create({
        data: {
          userId: decoded.userId,
          participantId: participant.id,
          roundId: round.id,
          maxScore: 100,
          startedAt: new Date(),
        },
      });
    }

    return successResponse({
      attempt: { id: attempt.id, startedAt: attempt.startedAt },
      prompt: round.prompt,
      scoringCriteria: round.scoringCriteria,
      timeLimit: round.timeLimit + (attempt.usedExtraTime ? 120 : 0),
      roundType: round.roundType,
      round: { id: round.id, title: round.title, roundNumber: round.roundNumber },
    });
  } catch (error) {
    console.error('VSC round fetch error:', error);
    return errorResponse('Failed to fetch round', 500);
  }
}

// POST — submit round answers
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { attemptId, answers, submission, videoUrl, timeTaken } = body;

    if (!attemptId) return errorResponse('Attempt ID required', 400);

    const attempt = await prisma.vSCRoundAttempt.findUnique({
      where: { id: attemptId },
      include: { round: true, participant: true },
    });
    if (!attempt) return errorResponse('Attempt not found', 404);
    if (attempt.userId !== decoded.userId) return errorResponse('Unauthorized', 403);
    if (attempt.completedAt) return errorResponse('Already submitted', 400);

    const round = attempt.round;

    let score = 0;
    let maxScore = attempt.maxScore;
    let gradedAnswers: Array<{ questionId: string; answer: string; isCorrect: boolean | undefined; points: number }> | undefined = undefined;

    // Grade quiz-type rounds
    if (['SPEED_IQ', 'DECISION_MAKING', 'PRESSURE'].includes(round.roundType) && answers) {
      const pool = round.questionPool as Array<Record<string, unknown>>;
      const poolMap = new Map(pool.map(q => [q.id as string, q]));

      gradedAnswers = (answers as Array<{ questionId: string; answer: string }>).map(a => {
        const original = poolMap.get(a.questionId);
        const isCorrect = original && String(original.correctAnswer) === String(a.answer);
        const points = isCorrect ? ((original?.points as number) || 10) : 0;
        score += points;
        return { questionId: a.questionId, answer: a.answer, isCorrect, points };
      });
    }

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    // Check time limit
    const startTime = attempt.startedAt ? new Date(attempt.startedAt).getTime() : 0;
    const allowedTime = (round.timeLimit + (attempt.usedExtraTime ? 120 : 0)) * 1000;
    const actualTime = timeTaken ? timeTaken * 1000 : (Date.now() - startTime);
    const timedOut = startTime > 0 && actualTime > allowedTime + 5000; // 5s grace

    // Update attempt
    const updatedAttempt = await prisma.vSCRoundAttempt.update({
      where: { id: attemptId },
      data: {
        answers: gradedAnswers || undefined,
        submission: submission || null,
        videoUrl: videoUrl || null,
        score,
        percentage,
        timeTaken: timeTaken || Math.round(actualTime / 1000),
        completedAt: new Date(),
        // For quiz rounds, auto-determine pass/fail
        passed: ['SPEED_IQ', 'DECISION_MAKING', 'PRESSURE'].includes(round.roundType)
          ? (!timedOut && percentage >= 50) // basic threshold; admin will finalize with ranking
          : false, // text rounds need manual review
      },
    });

    // Update participant total score
    await prisma.vSCParticipant.update({
      where: { id: attempt.participantId },
      data: {
        totalScore: { increment: score },
      },
    });

    return successResponse({
      score,
      maxScore,
      percentage,
      timedOut,
      passed: updatedAttempt.passed,
    });
  } catch (error) {
    console.error('VSC submit error:', error);
    return errorResponse('Submission failed', 500);
  }
}

// Fisher-Yates shuffle with deterministic seed
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const random = () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Suppress TypeScript unused variable
const correctAnswer = undefined;
void correctAnswer;
