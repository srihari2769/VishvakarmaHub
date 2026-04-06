import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export const maxDuration = 30;

const PLAN_DURATIONS: Record<string, number> = {
  PRACTICE_WEEKLY: 7,
  PRACTICE_MONTHLY: 30,
  VIP_MONTHLY: 30,
};

// GET — check active subscriptions
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    const subscriptions = await prisma.vSCSubscription.findMany({
      where: {
        userId: decoded.userId,
        challengeId: challenge.id,
        paymentStatus: 'PAID',
        isActive: true,
        expiresAt: { gte: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
    });

    const activePlans = subscriptions.map(s => s.plan);
    const hasVIP = activePlans.includes('VIP_MONTHLY');
    const hasPractice = hasVIP || activePlans.includes('PRACTICE_WEEKLY') || activePlans.includes('PRACTICE_MONTHLY');

    return successResponse({
      subscriptions,
      activePlans,
      hasVIP,
      hasPractice,
      plans: [
        { plan: 'PRACTICE_WEEKLY', price: challenge.practiceWeeklyPrice, label: 'Practice - Weekly', duration: '7 days', features: ['Unlimited practice rounds', '3 categories', 'Instant feedback'] },
        { plan: 'PRACTICE_MONTHLY', price: challenge.practiceMonthlyPrice, label: 'Practice - Monthly', duration: '30 days', features: ['Unlimited practice rounds', '3 categories', 'Instant feedback', 'Save 25%'] },
        { plan: 'VIP_MONTHLY', price: challenge.vipMonthlyPrice, label: 'VIP Season Pass', duration: '30 days', features: ['Everything in Practice', 'Priority judge review', 'VIP badge', 'Performance reports included', 'Exclusive VIP tournaments'] },
      ],
    });
  } catch (error) {
    console.error('Subscription GET error:', error);
    return errorResponse('Failed to fetch subscriptions', 500);
  }
}

// POST — create subscription order
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { plan } = body;
    if (!plan || !PLAN_DURATIONS[plan]) return errorResponse('Invalid plan', 400);

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    // Check existing active sub for same plan
    const existing = await prisma.vSCSubscription.findFirst({
      where: {
        userId: decoded.userId,
        challengeId: challenge.id,
        plan,
        isActive: true,
        paymentStatus: 'PAID',
        expiresAt: { gte: new Date() },
      },
    });
    if (existing) return errorResponse('You already have this plan active', 400);

    const prices: Record<string, number> = {
      PRACTICE_WEEKLY: challenge.practiceWeeklyPrice,
      PRACTICE_MONTHLY: challenge.practiceMonthlyPrice,
      VIP_MONTHLY: challenge.vipMonthlyPrice,
    };
    const price = prices[plan];

    const razorpay = await createRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: price * 100,
      currency: 'INR',
      receipt: `vsc_sub_${decoded.userId.slice(-6)}_${Date.now()}`,
      notes: { userId: decoded.userId, plan, challengeId: challenge.id },
    });

    const sub = await prisma.vSCSubscription.create({
      data: {
        userId: decoded.userId,
        challengeId: challenge.id,
        plan,
        price,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + PLAN_DURATIONS[plan] * 24 * 60 * 60 * 1000),
        razorpayOrderId: order.id,
        paymentStatus: 'PENDING',
        isActive: false,
      },
    });

    const { keyId } = await getRazorpayKeys();
    return successResponse({
      orderId: order.id,
      subscriptionId: sub.id,
      amount: price * 100,
      currency: 'INR',
      keyId,
      plan,
    });
  } catch (error) {
    console.error('Subscription POST error:', error);
    return errorResponse('Failed to create order', 500);
  }
}

// PATCH — verify payment
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { subscriptionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!subscriptionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Missing payment details', 400);
    }

    const sub = await prisma.vSCSubscription.findUnique({ where: { id: subscriptionId } });
    if (!sub || sub.userId !== decoded.userId) return errorResponse('Subscription not found', 404);

    const { keySecret } = await getRazorpayKeys();
    const generated = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (generated !== razorpay_signature) return errorResponse('Payment verification failed', 400);

    const updated = await prisma.vSCSubscription.update({
      where: { id: subscriptionId },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: 'PAID',
        isActive: true,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + PLAN_DURATIONS[sub.plan] * 24 * 60 * 60 * 1000),
      },
    });

    return successResponse({ subscription: updated, message: 'Subscription activated!' });
  } catch (error) {
    console.error('Subscription PATCH error:', error);
    return errorResponse('Payment verification failed', 500);
  }
}
