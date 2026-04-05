import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';

export const maxDuration = 30;

// GET — public: get active VSC challenge info
export async function GET() {
  try {
    const challenge = await prisma.vSCChallenge.findFirst({
      where: { isActive: true },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
          select: {
            id: true,
            roundNumber: true,
            title: true,
            description: true,
            roundType: true,
            timeLimit: true,
            passingPercent: true,
            isActive: true,
            isLocked: true,
            startsAt: true,
            endsAt: true,
            _count: { select: { attempts: true } },
          },
        },
        _count: { select: { participants: true } },
      },
    });

    if (!challenge) {
      return errorResponse('No active challenge found', 404);
    }

    return successResponse(challenge);
  } catch (error) {
    console.error('VSC fetch error:', error);
    return errorResponse('Failed to fetch challenge', 500);
  }
}

// POST — register for VSC challenge
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { name, phone, email, college, city, state, referralBy } = body;

    if (!name || !phone || !email || !city || !state) {
      return errorResponse('All required fields must be filled', 400);
    }

    const challenge = await prisma.vSCChallenge.findFirst({
      where: { isActive: true },
    });
    if (!challenge) return errorResponse('No active challenge', 404);

    // Check existing registrations count for this user
    const existingAttempts = await prisma.vSCParticipant.count({
      where: { userId: decoded.userId, challengeId: challenge.id },
    });

    const attemptNumber = existingAttempts + 1;
    let entryFee = challenge.entryFee;
    if (attemptNumber === 2) entryFee = challenge.secondChanceFee;
    if (attemptNumber >= 3) entryFee = challenge.thirdChanceFee;

    // Generate unique referral code
    const referralCode = `VSC-${decoded.userId.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const participant = await prisma.vSCParticipant.create({
      data: {
        userId: decoded.userId,
        challengeId: challenge.id,
        name,
        phone,
        email,
        college: college || null,
        city,
        state,
        entryFee,
        attemptNumber,
        referralCode,
      },
    });

    // If referred by someone, increment their referral count
    if (referralBy) {
      await prisma.vSCParticipant.updateMany({
        where: { referralCode: referralBy },
        data: { referralsCount: { increment: 1 } },
      });
    }

    // Create Razorpay order
    const razorpay = await createRazorpayInstance();
    const { keyId: rzpKeyId } = await getRazorpayKeys();

    const order = await razorpay.orders.create({
      amount: Math.round(entryFee * 100),
      currency: 'INR',
      receipt: participant.id,
      notes: {
        participant_id: participant.id,
        challenge_id: challenge.id,
        type: 'vsc_entry',
        attempt: String(attemptNumber),
      },
    });

    await prisma.vSCParticipant.update({
      where: { id: participant.id },
      data: { razorpayOrderId: order.id },
    });

    return successResponse({
      participant,
      entryFee,
      orderId: order.id,
      amount: entryFee,
      currency: 'INR',
      keyId: rzpKeyId,
      prefill: { name, email, contact: phone },
    }, 201);
  } catch (error: unknown) {
    console.error('VSC registration error:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return errorResponse('You have already registered for this attempt', 409);
    }
    return errorResponse('Registration failed', 500);
  }
}

// PUT — verify Razorpay payment for VSC registration
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { participantId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!participantId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Missing payment verification data', 400);
    }

    const { keySecret: secret } = await getRazorpayKeys();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return errorResponse('Invalid payment signature', 400);
    }

    const participant = await prisma.vSCParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.userId !== decoded.userId) {
      return errorResponse('Participant not found', 404);
    }

    if (participant.paymentStatus === 'PAID') {
      return successResponse({ message: 'Payment already verified' });
    }

    await prisma.vSCParticipant.update({
      where: { id: participantId },
      data: {
        paymentStatus: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'VSC Registration Confirmed!',
        message: `You have entered the Vishvakarma Survival Challenge! Entry fee ₹${participant.entryFee} received. Your referral code: ${participant.referralCode}`,
        link: '/vsc/dashboard',
        userId: decoded.userId,
      },
    });

    return successResponse({ message: 'Payment confirmed! Welcome to the arena.' });
  } catch (error) {
    console.error('VSC payment verification error:', error);
    return errorResponse('Failed to verify payment', 500);
  }
}
