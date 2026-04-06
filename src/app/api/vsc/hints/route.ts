import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export const maxDuration = 15;

const MAX_HINTS_PER_ROUND = 3;
const HINT_PRICE = 9;

// POST — purchase a hint (creates Razorpay order)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { attemptId, questionIndex } = body;
    if (!attemptId || questionIndex === undefined) return errorResponse('Missing attemptId or questionIndex', 400);

    const attempt = await prisma.vSCRoundAttempt.findUnique({
      where: { id: attemptId },
      include: { participant: true, round: true },
    });
    if (!attempt) return errorResponse('Attempt not found', 404);
    if (attempt.participant.userId !== decoded.userId) return errorResponse('Unauthorized', 403);
    if (attempt.completedAt) return errorResponse('Round not in progress', 400);
    if (attempt.hintsUsed >= MAX_HINTS_PER_ROUND) return errorResponse('Max hints reached for this round', 400);

    // Check if user has VIP (free hints)
    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    const hasVIP = challenge ? await prisma.vSCSubscription.findFirst({
      where: {
        userId: decoded.userId,
        challengeId: challenge.id,
        plan: 'VIP_MONTHLY',
        isActive: true,
        paymentStatus: 'PAID',
        expiresAt: { gte: new Date() },
      },
    }) : null;

    if (hasVIP) {
      // VIP members get free hints
      await prisma.vSCRoundAttempt.update({
        where: { id: attemptId },
        data: { hintsUsed: { increment: 1 } },
      });

      // Return hint: eliminate 2 wrong answers from question
      const questionPool = attempt.round.questionPool as Array<{ options: string[]; correctAnswer: string }> | null;
      const question = questionPool?.[questionIndex];
      let eliminatedOptions: string[] = [];
      if (question) {
        const wrongOptions = question.options.filter((o: string) => o !== question.correctAnswer);
        eliminatedOptions = wrongOptions.slice(0, 2);
      }

      return successResponse({
        free: true,
        hintsUsed: attempt.hintsUsed + 1,
        maxHints: MAX_HINTS_PER_ROUND,
        eliminatedOptions,
      });
    }

    // Paid hint — create Razorpay order
    const razorpay = await createRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: HINT_PRICE * 100,
      currency: 'INR',
      receipt: `vsc_hint_${decoded.userId.slice(-6)}_${Date.now()}`,
      notes: { userId: decoded.userId, attemptId, questionIndex: String(questionIndex) },
    });

    const { keyId } = await getRazorpayKeys();
    return successResponse({
      free: false,
      orderId: order.id,
      amount: HINT_PRICE * 100,
      currency: 'INR',
      keyId,
      price: HINT_PRICE,
    });
  } catch (error) {
    console.error('Hint POST error:', error);
    return errorResponse('Failed to process hint', 500);
  }
}

// PATCH — verify hint payment and reveal hint
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { attemptId, questionIndex, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!attemptId || questionIndex === undefined || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Missing details', 400);
    }

    const attempt = await prisma.vSCRoundAttempt.findUnique({
      where: { id: attemptId },
      include: { participant: true, round: true },
    });
    if (!attempt) return errorResponse('Attempt not found', 404);
    if (attempt.participant.userId !== decoded.userId) return errorResponse('Unauthorized', 403);

    const { keySecret } = await getRazorpayKeys();
    const generated = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (generated !== razorpay_signature) return errorResponse('Payment verification failed', 400);

    await prisma.vSCRoundAttempt.update({
      where: { id: attemptId },
      data: { hintsUsed: { increment: 1 } },
    });

    // Return eliminated options
    const questionPool = attempt.round.questionPool as Array<{ options: string[]; correctAnswer: string }> | null;
    const question = questionPool?.[questionIndex];
    let eliminatedOptions: string[] = [];
    if (question) {
      const wrongOptions = question.options.filter((o: string) => o !== question.correctAnswer);
      eliminatedOptions = wrongOptions.slice(0, 2);
    }

    return successResponse({
      hintsUsed: attempt.hintsUsed + 1,
      maxHints: MAX_HINTS_PER_ROUND,
      eliminatedOptions,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Hint PATCH error:', error);
    return errorResponse('Payment verification failed', 500);
  }
}
