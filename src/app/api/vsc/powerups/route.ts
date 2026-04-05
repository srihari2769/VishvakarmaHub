import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';

export const maxDuration = 30;

// POST — purchase a power-up
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { type } = body;

    if (!['SKIP_ROUND', 'EXTRA_TIME', 'REVIVE', 'LEADERBOARD_BOOST'].includes(type)) {
      return errorResponse('Invalid power-up type', 400);
    }

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    const participant = await prisma.vSCParticipant.findFirst({
      where: { userId: decoded.userId, challengeId: challenge.id, paymentStatus: 'PAID' },
      orderBy: { attemptNumber: 'desc' },
    });
    if (!participant) return errorResponse('Not registered', 404);

    const priceMap: Record<string, number> = {
      SKIP_ROUND: challenge.skipRoundPrice,
      EXTRA_TIME: challenge.extraTimePrice,
      REVIVE: challenge.revivePrice,
      LEADERBOARD_BOOST: challenge.leaderboardBoostPrice,
    };

    const price = priceMap[type];

    // For REVIVE, un-eliminate the participant
    if (type === 'REVIVE' && !participant.isEliminated) {
      return errorResponse('You are not eliminated', 400);
    }

    // For LEADERBOARD_BOOST
    if (type === 'LEADERBOARD_BOOST' && participant.isBoosted) {
      return errorResponse('Already boosted', 400);
    }

    const powerUp = await prisma.vSCPowerUp.create({
      data: {
        userId: decoded.userId,
        participantId: participant.id,
        type,
        price,
      },
    });

    // Create Razorpay order
    const razorpay = await createRazorpayInstance();
    const { keyId: rzpKeyId } = await getRazorpayKeys();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });

    const order = await razorpay.orders.create({
      amount: Math.round(price * 100),
      currency: 'INR',
      receipt: powerUp.id,
      notes: {
        power_up_id: powerUp.id,
        participant_id: participant.id,
        type: `vsc_powerup_${type.toLowerCase()}`,
      },
    });

    await prisma.vSCPowerUp.update({
      where: { id: powerUp.id },
      data: { razorpayOrderId: order.id },
    });

    return successResponse({
      powerUp,
      price,
      orderId: order.id,
      amount: price,
      currency: 'INR',
      keyId: rzpKeyId,
      prefill: {
        name: user ? `${user.firstName} ${user.lastName}` : participant.name,
        email: user?.email || participant.email,
        contact: user?.phone || participant.phone,
      },
    }, 201);
  } catch (error) {
    console.error('VSC power-up error:', error);
    return errorResponse('Failed to create power-up', 500);
  }
}

// PUT — verify Razorpay payment for power-up
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { powerUpId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!powerUpId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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

    const powerUp = await prisma.vSCPowerUp.findUnique({ where: { id: powerUpId } });
    if (!powerUp || powerUp.userId !== decoded.userId) {
      return errorResponse('Power-up not found', 404);
    }

    if (powerUp.paymentStatus === 'PAID') {
      return successResponse({ message: 'Payment already verified' });
    }

    await prisma.vSCPowerUp.update({
      where: { id: powerUpId },
      data: { paymentStatus: 'PAID', razorpayPaymentId: razorpay_payment_id },
    });

    return successResponse({ message: 'Power-up payment confirmed!' });
  } catch (error) {
    console.error('VSC power-up payment error:', error);
    return errorResponse('Failed to verify payment', 500);
  }
}

// PATCH — use a power-up (after payment verified)
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { powerUpId, roundNumber } = body;

    if (!powerUpId) return errorResponse('Power-up ID required', 400);

    const powerUp = await prisma.vSCPowerUp.findUnique({
      where: { id: powerUpId },
      include: { participant: true },
    });
    if (!powerUp) return errorResponse('Power-up not found', 404);
    if (powerUp.userId !== decoded.userId) return errorResponse('Unauthorized', 403);
    if (powerUp.paymentStatus !== 'PAID') return errorResponse('Payment not verified', 400);
    if (powerUp.isUsed) return errorResponse('Already used', 400);

    // Apply power-up effect
    const updates: Record<string, unknown> = { isUsed: true, usedAt: new Date(), usedAtRound: roundNumber };

    await prisma.vSCPowerUp.update({ where: { id: powerUpId }, data: updates });

    // Apply effect to participant
    if (powerUp.type === 'REVIVE') {
      await prisma.vSCParticipant.update({
        where: { id: powerUp.participantId },
        data: { isEliminated: false, eliminatedAt: null },
      });
    } else if (powerUp.type === 'LEADERBOARD_BOOST') {
      await prisma.vSCParticipant.update({
        where: { id: powerUp.participantId },
        data: { isBoosted: true },
      });
    } else if (powerUp.type === 'EXTRA_TIME') {
      // Mark on the current round attempt
      const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
      if (challenge) {
        const round = await prisma.vSCRound.findFirst({
          where: { challengeId: challenge.id, roundNumber: roundNumber || powerUp.participant.currentRound },
        });
        if (round) {
          await prisma.vSCRoundAttempt.updateMany({
            where: { participantId: powerUp.participantId, roundId: round.id },
            data: { usedExtraTime: true },
          });
        }
      }
    } else if (powerUp.type === 'SKIP_ROUND') {
      // Auto-pass the current round
      const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
      if (challenge) {
        const round = await prisma.vSCRound.findFirst({
          where: { challengeId: challenge.id, roundNumber: powerUp.participant.currentRound },
        });
        if (round) {
          await prisma.vSCRoundAttempt.upsert({
            where: { participantId_roundId: { participantId: powerUp.participantId, roundId: round.id } },
            create: {
              userId: decoded.userId,
              participantId: powerUp.participantId,
              roundId: round.id,
              score: 0,
              maxScore: 0,
              percentage: 100,
              passed: true,
              usedSkipRound: true,
              completedAt: new Date(),
              startedAt: new Date(),
            },
            update: { passed: true, usedSkipRound: true, completedAt: new Date() },
          });
          await prisma.vSCParticipant.update({
            where: { id: powerUp.participantId },
            data: { currentRound: { increment: 1 } },
          });
        }
      }
    }

    return successResponse({ message: 'Power-up applied' });
  } catch (error) {
    console.error('VSC power-up use error:', error);
    return errorResponse('Failed to use power-up', 500);
  }
}
