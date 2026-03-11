import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';
import { getRazorpayKeys } from '@/lib/razorpay';

// POST /api/payments/razorpay/verify — Verify Razorpay payment via webhook signature
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return errorResponse('Missing signature', 400);
    }

    const { keySecret } = await getRazorpayKeys();
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return errorResponse('Invalid signature', 400);
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const contributionId = payment.notes?.contribution_id;

      if (contributionId) {
        // Update contribution status
        await prisma.contribution.update({
          where: { id: contributionId },
          data: {
            transactionId: payment.id,
            status: 'COMPLETED',
          },
        });

        // Get contribution to update campaign
        const contribution = await prisma.contribution.findUnique({
          where: { id: contributionId },
          include: { campaign: true },
        });

        if (contribution?.campaign) {
          await prisma.campaign.update({
            where: { id: contribution.campaign.id },
            data: {
              raisedAmount: { increment: contribution.amount },
              supporterCount: { increment: 1 },
            },
          });
        }
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const contributionId = payment.notes?.contribution_id;

      if (contributionId) {
        await prisma.contribution.update({
          where: { id: contributionId },
          data: {
            status: 'FAILED',
          },
        });
      }
    }

    return successResponse({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return errorResponse('Webhook processing failed', 500);
  }
}
