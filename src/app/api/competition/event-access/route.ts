import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';

export const maxDuration = 30;

// PATCH /api/competition/event-access — Save participation mode
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { participationMode } = await request.json();
    if (!participationMode || !['IDEA_SUBMISSION', 'EVENT_ACCESS'].includes(participationMode)) {
      return errorResponse('Invalid participation mode', 400);
    }

    const competition = await prisma.competition.findFirst({ where: { isActive: true } });
    if (!competition) return errorResponse('No active competition', 400);

    const participant = await prisma.competitionParticipant.findUnique({
      where: { userId_competitionId: { userId: decoded.userId, competitionId: competition.id } },
    });
    if (!participant) return errorResponse('Please register for the competition first', 400);

    await prisma.competitionParticipant.update({
      where: { id: participant.id },
      data: { participationMode },
    });

    return successResponse({ message: 'Participation mode updated' });
  } catch (error) {
    console.error('Update participation mode error:', error);
    return errorResponse('Failed to update participation mode', 500);
  }
}

// POST /api/competition/event-access — Create Razorpay order for event access
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const competition = await prisma.competition.findFirst({ where: { isActive: true } });
    if (!competition) return errorResponse('No active competition', 400);

    const participant = await prisma.competitionParticipant.findUnique({
      where: { userId_competitionId: { userId: decoded.userId, competitionId: competition.id } },
    });
    if (!participant) return errorResponse('Please register for the competition first', 400);

    if (participant.paymentStatus === 'PAID') {
      return errorResponse('You have already paid. Check your dashboard.', 400);
    }

    const baseFee = participant.participantType === 'STUDENT'
      ? competition.studentFee
      : competition.founderFee;
    const totalFee = baseFee; // Event access is single person, no team

    // Update participant mode and fee
    const updated = await prisma.competitionParticipant.update({
      where: { id: participant.id },
      data: {
        participationMode: 'EVENT_ACCESS',
        teamSize: 1,
        teamName: null,
        teamMembers: undefined,
        totalFee,
      },
    });

    // Get user for Razorpay prefill
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });

    // Create Razorpay order
    const razorpay = await createRazorpayInstance();
    const { keyId: rzpKeyId } = await getRazorpayKeys();

    const order = await razorpay.orders.create({
      amount: Math.round(totalFee * 100),
      currency: 'INR',
      receipt: updated.id,
      notes: {
        participant_id: updated.id,
        competition_id: competition.id,
        type: 'competition_event_access',
      },
    });

    await prisma.competitionParticipant.update({
      where: { id: updated.id },
      data: { razorpayOrderId: order.id },
    });

    return successResponse({
      participantId: updated.id,
      orderId: order.id,
      amount: totalFee,
      currency: 'INR',
      keyId: rzpKeyId,
      competitionName: competition.name,
      prefill: {
        name: user ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
        contact: user?.phone || participant.phone || '',
      },
    });
  } catch (error) {
    console.error('Event access order error:', error);
    return errorResponse('Failed to create order', 500);
  }
}

// PUT /api/competition/event-access — Verify payment after Razorpay checkout
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

    const participant = await prisma.competitionParticipant.findUnique({
      where: { id: participantId },
      include: { competition: { select: { name: true } } },
    });

    if (!participant || participant.userId !== decoded.userId) {
      return errorResponse('Participant not found', 404);
    }

    if (participant.paymentStatus === 'PAID') {
      return successResponse({ message: 'Payment already verified' });
    }

    await prisma.competitionParticipant.update({
      where: { id: participantId },
      data: {
        paymentStatus: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Event Access Confirmed!',
        message: `Your event access pass for ${participant.competition.name} is confirmed. Payment of ₹${participant.totalFee} received.`,
        link: '/competition/dashboard',
        userId: decoded.userId,
      },
    });

    return successResponse({ message: 'Payment confirmed! Your event access pass is ready.' });
  } catch (error) {
    console.error('Event access payment verification error:', error);
    return errorResponse('Failed to verify payment', 500);
  }
}
