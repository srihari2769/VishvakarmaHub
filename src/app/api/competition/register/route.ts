import { NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// POST /api/competition/register — Create registration + Razorpay order
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { startupId, registrationType } = await request.json();

    if (!startupId || !registrationType) {
      return errorResponse('startupId and registrationType are required', 400);
    }

    if (!['STUDENT', 'FOUNDER'].includes(registrationType)) {
      return errorResponse('registrationType must be STUDENT or FOUNDER', 400);
    }

    // Check active competition in registration phase
    const competition = await prisma.competition.findFirst({
      where: { isActive: true, currentPhase: 'REGISTRATION' },
    });
    if (!competition) {
      return errorResponse('Registration is not currently open', 400);
    }

    // Verify startup belongs to user and is approved
    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) return errorResponse('Startup not found', 404);
    if (startup.founderId !== decoded.userId) {
      return errorResponse('You can only register your own startup', 403);
    }
    if (startup.status !== 'APPROVED' && startup.status !== 'ACTIVE') {
      return errorResponse('Only approved startups can be registered', 400);
    }

    // Check duplicate
    const existing = await prisma.competitionEntry.findUnique({
      where: { startupId_competitionId: { startupId, competitionId: competition.id } },
    });
    if (existing) {
      if (existing.paymentStatus === 'PAID') {
        return errorResponse('This startup is already registered and paid', 400);
      }
      // If pending payment, delete old entry so they can re-register
      await prisma.competitionEntry.delete({ where: { id: existing.id } });
    }

    const fee = registrationType === 'STUDENT' ? competition.studentFee : competition.founderFee;

    // Create entry with PENDING payment
    const entry = await prisma.competitionEntry.create({
      data: {
        startupId,
        competitionId: competition.id,
        userId: decoded.userId,
        registrationType,
        registrationFee: fee,
        paymentStatus: 'PENDING',
      },
    });

    // Get user for Razorpay prefill
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(fee * 100),
      currency: 'INR',
      receipt: entry.id,
      notes: {
        entry_id: entry.id,
        competition_id: competition.id,
        startup_id: startupId,
        type: 'competition_registration',
      },
    });

    // Save order ID
    await prisma.competitionEntry.update({
      where: { id: entry.id },
      data: { razorpayOrderId: order.id },
    });

    return successResponse({
      entryId: entry.id,
      orderId: order.id,
      amount: fee,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      competitionName: competition.name,
      startupTitle: startup.title,
      prefill: {
        name: user ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
    });
  } catch (error) {
    console.error('Competition registration error:', error);
    return errorResponse('Failed to create registration order', 500);
  }
}

// PUT /api/competition/register — Verify payment after Razorpay checkout
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { entryId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!entryId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Missing payment verification data', 400);
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return errorResponse('Invalid payment signature', 400);
    }

    // Verify entry belongs to user
    const entry = await prisma.competitionEntry.findUnique({
      where: { id: entryId },
      include: { startup: { select: { title: true } }, competition: { select: { name: true } } },
    });

    if (!entry || entry.userId !== decoded.userId) {
      return errorResponse('Entry not found', 404);
    }

    if (entry.paymentStatus === 'PAID') {
      return successResponse({ message: 'Payment already verified' });
    }

    // Update entry to paid
    await prisma.competitionEntry.update({
      where: { id: entryId },
      data: {
        paymentStatus: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Competition Registration Confirmed',
        message: `Your startup "${entry.startup.title}" has been registered for ${entry.competition.name}. Payment of ₹${entry.registrationFee} received.`,
        link: '/competition',
        userId: decoded.userId,
      },
    });

    return successResponse({ message: 'Registration confirmed!' });
  } catch (error) {
    console.error('Payment verification error:', error);
    return errorResponse('Failed to verify payment', 500);
  }
}
