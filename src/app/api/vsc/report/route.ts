import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export const maxDuration = 30;

function generateReport(participant: Record<string, unknown>, attempts: Array<Record<string, unknown>>) {
  const totalRounds = attempts.length;
  const totalScore = attempts.reduce((sum: number, a: Record<string, unknown>) => sum + ((a.score as number) || 0), 0);
  const maxPossible = attempts.reduce((sum: number, a: Record<string, unknown>) => sum + ((a.maxScore as number) || 100), 0);
  const avgScore = totalRounds > 0 ? Math.round(totalScore / totalRounds) : 0;
  const accuracy = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  const roundPerformance = attempts.map((a: Record<string, unknown>) => ({
    roundNumber: (a as Record<string, unknown> & { round?: { roundNumber?: number } }).round?.roundNumber,
    score: a.score,
    maxScore: a.maxScore,
    status: a.status,
    percentage: (a.maxScore as number) > 0 ? Math.round(((a.score as number) / (a.maxScore as number)) * 100) : 0,
  }));

  let strengthAreas: string[] = [];
  let improvementAreas: string[] = [];

  if (accuracy >= 80) strengthAreas.push('Excellent knowledge base');
  if (accuracy >= 60) strengthAreas.push('Consistent performance');
  if (totalRounds >= 5) strengthAreas.push('Strong persistence');
  if (attempts.some((a: Record<string, unknown>) => ((a.score as number) || 0) >= ((a.maxScore as number) || 100) * 0.9)) {
    strengthAreas.push('Can achieve near-perfect scores');
  }

  if (accuracy < 50) improvementAreas.push('Focus on fundamental concepts');
  if (accuracy < 70) improvementAreas.push('Practice more diverse question types');
  if (totalRounds < 3) improvementAreas.push('Participate in more rounds');

  const trend = roundPerformance.length >= 2
    ? roundPerformance[roundPerformance.length - 1].percentage > roundPerformance[0].percentage
      ? 'IMPROVING'
      : roundPerformance[roundPerformance.length - 1].percentage < roundPerformance[0].percentage
        ? 'DECLINING'
        : 'STABLE'
    : 'INSUFFICIENT_DATA';

  let tier = 'Bronze';
  if (accuracy >= 90) tier = 'Diamond';
  else if (accuracy >= 75) tier = 'Gold';
  else if (accuracy >= 60) tier = 'Silver';

  return {
    summary: {
      totalRounds,
      totalScore,
      maxPossible,
      avgScore,
      accuracy,
      tier,
      trend,
      currentRound: (participant as Record<string, unknown> & { currentRound?: number }).currentRound || 0,
      status: (participant as Record<string, unknown> & { status?: string }).status || 'ACTIVE',
    },
    roundPerformance,
    analysis: {
      strengthAreas: strengthAreas.length > 0 ? strengthAreas : ['Keep practicing!'],
      improvementAreas: improvementAreas.length > 0 ? improvementAreas : ['Maintain your current trajectory'],
      recommendations: [
        accuracy < 70 ? 'Use Practice Arena daily to improve weak areas' : 'Try VIP membership for advanced challenges',
        'Maintain daily streaks for bonus rewards',
        totalRounds < 5 ? 'Complete more rounds for better analysis' : 'You have strong round experience',
      ],
    },
    generatedAt: new Date().toISOString(),
  };
}

// GET — check if report exists or get it
export async function GET(request: NextRequest) {
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

    const reports = await prisma.vSCPerformanceReport.findMany({
      where: { userId: decoded.userId, participantId: participant.id, paymentStatus: 'PAID' },
      orderBy: { createdAt: 'desc' },
    });

    // VIP members get free reports
    const hasVIP = await prisma.vSCSubscription.findFirst({
      where: {
        userId: decoded.userId,
        challengeId: challenge.id,
        plan: 'VIP_MONTHLY',
        isActive: true,
        paymentStatus: 'PAID',
        expiresAt: { gte: new Date() },
      },
    });

    return successResponse({
      reports,
      hasVIP: !!hasVIP,
      reportPrice: challenge.reportPrice,
    });
  } catch (error) {
    console.error('Report GET error:', error);
    return errorResponse('Failed', 500);
  }
}

// POST — purchase report or generate free (VIP)
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
      include: { attempts: { include: { round: true }, orderBy: { createdAt: 'asc' } } },
    });
    if (!participant) return errorResponse('Not a participant', 404);

    // VIP — free report
    const hasVIP = await prisma.vSCSubscription.findFirst({
      where: {
        userId: decoded.userId,
        challengeId: challenge.id,
        plan: 'VIP_MONTHLY',
        isActive: true,
        paymentStatus: 'PAID',
        expiresAt: { gte: new Date() },
      },
    });

    if (hasVIP) {
      const reportData = generateReport(
        participant as unknown as Record<string, unknown>,
        participant.attempts as unknown as Array<Record<string, unknown>>
      );
      const report = await prisma.vSCPerformanceReport.create({
        data: {
          userId: decoded.userId,
          participantId: participant.id,
          reportData: JSON.parse(JSON.stringify(reportData)),
          price: 0,
          paymentStatus: 'PAID',
        },
      });
      return successResponse({ report, free: true });
    }

    // Paid report — create Razorpay order
    const razorpay = await createRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: challenge.reportPrice * 100,
      currency: 'INR',
      receipt: `vsc_report_${decoded.userId.slice(-6)}_${Date.now()}`,
      notes: { userId: decoded.userId, participantId: participant.id },
    });

    const report = await prisma.vSCPerformanceReport.create({
      data: {
        userId: decoded.userId,
        participantId: participant.id,
        reportData: {},
        price: challenge.reportPrice,
        razorpayPaymentId: order.id,
        paymentStatus: 'PENDING',
      },
    });

    const { keyId } = await getRazorpayKeys();
    return successResponse({
      orderId: order.id,
      reportId: report.id,
      amount: challenge.reportPrice * 100,
      currency: 'INR',
      keyId,
    });
  } catch (error) {
    console.error('Report POST error:', error);
    return errorResponse('Failed', 500);
  }
}

// PATCH — verify report payment and generate
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { reportId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!reportId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Missing details', 400);
    }

    const report = await prisma.vSCPerformanceReport.findUnique({
      where: { id: reportId },
      include: { participant: { include: { attempts: { include: { round: true }, orderBy: { createdAt: 'asc' } } } } },
    });
    if (!report || report.userId !== decoded.userId) return errorResponse('Report not found', 404);

    const { keySecret } = await getRazorpayKeys();
    const sig = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (sig !== razorpay_signature) return errorResponse('Payment verification failed', 400);

    const reportData = generateReport(
      report.participant as unknown as Record<string, unknown>,
      report.participant.attempts as unknown as Array<Record<string, unknown>>
    );

    const updated = await prisma.vSCPerformanceReport.update({
      where: { id: reportId },
      data: { razorpayPaymentId: razorpay_payment_id, paymentStatus: 'PAID', reportData: JSON.parse(JSON.stringify(reportData)) },
    });

    return successResponse({ report: updated });
  } catch (error) {
    console.error('Report PATCH error:', error);
    return errorResponse('Payment verification failed', 500);
  }
}
