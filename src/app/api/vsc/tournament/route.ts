import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export const maxDuration = 30;

// GET — list tournaments + leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('id');

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    if (tournamentId) {
      const tournament = await prisma.vSCTournament.findUnique({
        where: { id: tournamentId },
        include: {
          entries: {
            where: { paymentStatus: 'PAID' },
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }],
          },
        },
      });
      if (!tournament) return errorResponse('Tournament not found', 404);

      const leaderboard = tournament.entries
        .filter(e => e.completedAt)
        .map((e, i) => ({
          rank: i + 1,
          name: `${e.user.firstName} ${e.user.lastName}`,
          score: e.score,
          maxScore: e.maxScore,
          timeTaken: e.timeTaken,
        }));

      return successResponse({
        tournament: { ...tournament, entries: undefined },
        leaderboard,
        totalParticipants: tournament.entries.length,
      });
    }

    const tournaments = await prisma.vSCTournament.findMany({
      where: { challengeId: challenge.id, isActive: true },
      include: { _count: { select: { entries: { where: { paymentStatus: 'PAID' } } } } },
      orderBy: { startsAt: 'asc' },
    });

    return successResponse({
      tournaments: tournaments.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        entryFee: t.entryFee,
        prizePool: t.prizePool,
        prizes: t.prizes,
        startsAt: t.startsAt,
        endsAt: t.endsAt,
        timeLimit: t.timeLimit,
        maxParticipants: t.maxParticipants,
        participantCount: t._count.entries,
        isLive: new Date() >= t.startsAt && new Date() <= t.endsAt,
      })),
    });
  } catch (error) {
    console.error('Tournament GET error:', error);
    return errorResponse('Failed to fetch tournaments', 500);
  }
}

// POST — join tournament (create Razorpay order)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { tournamentId } = body;
    if (!tournamentId) return errorResponse('Tournament ID required', 400);

    const tournament = await prisma.vSCTournament.findUnique({
      where: { id: tournamentId },
      include: { _count: { select: { entries: { where: { paymentStatus: 'PAID' } } } } },
    });
    if (!tournament || !tournament.isActive) return errorResponse('Tournament not found or inactive', 404);

    if (tournament.maxParticipants && tournament._count.entries >= tournament.maxParticipants) {
      return errorResponse('Tournament is full', 400);
    }

    const existing = await prisma.vSCTournamentEntry.findUnique({
      where: { tournamentId_userId: { tournamentId, userId: decoded.userId } },
    });
    if (existing?.paymentStatus === 'PAID') return errorResponse('Already joined', 400);

    const razorpay = await createRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: tournament.entryFee * 100,
      currency: 'INR',
      receipt: `vsc_tourn_${decoded.userId.slice(-6)}_${Date.now()}`,
      notes: { userId: decoded.userId, tournamentId },
    });

    const entry = existing
      ? await prisma.vSCTournamentEntry.update({
          where: { id: existing.id },
          data: { razorpayOrderId: order.id, paymentStatus: 'PENDING' },
        })
      : await prisma.vSCTournamentEntry.create({
          data: {
            tournamentId,
            userId: decoded.userId,
            razorpayOrderId: order.id,
            paymentStatus: 'PENDING',
          },
        });

    const { keyId } = await getRazorpayKeys();
    return successResponse({
      orderId: order.id,
      entryId: entry.id,
      amount: tournament.entryFee * 100,
      currency: 'INR',
      keyId,
    });
  } catch (error) {
    console.error('Tournament POST error:', error);
    return errorResponse('Failed to join tournament', 500);
  }
}

// PATCH — verify payment OR submit answers
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { action } = body;

    if (action === 'verify') {
      const { entryId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (!entryId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return errorResponse('Missing payment details', 400);
      }

      const entry = await prisma.vSCTournamentEntry.findUnique({ where: { id: entryId } });
      if (!entry || entry.userId !== decoded.userId) return errorResponse('Entry not found', 404);

      const { keySecret } = await getRazorpayKeys();
      const sig = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      if (sig !== razorpay_signature) return errorResponse('Payment verification failed', 400);

      const updated = await prisma.vSCTournamentEntry.update({
        where: { id: entryId },
        data: { razorpayPaymentId: razorpay_payment_id, paymentStatus: 'PAID' },
      });

      return successResponse({ entry: updated, message: 'Registration confirmed!' });
    }

    if (action === 'submit') {
      const { tournamentId, answers, timeTaken } = body;
      if (!tournamentId || !answers) return errorResponse('Missing data', 400);

      const entry = await prisma.vSCTournamentEntry.findUnique({
        where: { tournamentId_userId: { tournamentId, userId: decoded.userId } },
      });
      if (!entry || entry.paymentStatus !== 'PAID') return errorResponse('Not registered', 400);
      if (entry.completedAt) return errorResponse('Already submitted', 400);

      const tournament = await prisma.vSCTournament.findUnique({ where: { id: tournamentId } });
      if (!tournament) return errorResponse('Tournament not found', 404);

      const questions = tournament.questionPool as Array<{ id: string; correctAnswer: string; points: number }> | null;
      let score = 0;
      let maxScore = 0;
      const graded = answers.map((a: { questionId: string; answer: string }) => {
        const q = questions?.find(q => q.id === a.questionId);
        const pts = q?.points || 10;
        maxScore += pts;
        const isCorrect = q && q.correctAnswer === a.answer;
        if (isCorrect) score += pts;
        return { ...a, isCorrect, points: isCorrect ? pts : 0 };
      });

      const updated = await prisma.vSCTournamentEntry.update({
        where: { id: entry.id },
        data: { score, maxScore, timeTaken: timeTaken || null, answers: graded, completedAt: new Date() },
      });

      return successResponse({ entry: updated, score, maxScore });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    console.error('Tournament PATCH error:', error);
    return errorResponse('Failed', 500);
  }
}
