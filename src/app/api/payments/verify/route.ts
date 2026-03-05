import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// POST /api/payments/verify — Client-side payment verification after Razorpay checkout
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, contributionId } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !contributionId) {
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

    // Verify the contribution belongs to this user
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: { campaign: true },
    });

    if (!contribution || contribution.userId !== decoded.userId) {
      return errorResponse('Contribution not found', 404);
    }

    if (contribution.status === 'COMPLETED') {
      return successResponse({ message: 'Payment already verified' });
    }

    // Update contribution to completed
    await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        transactionId: razorpay_payment_id,
        status: 'COMPLETED',
      },
    });

    // Update campaign totals
    if (contribution.campaign) {
      await prisma.campaign.update({
        where: { id: contribution.campaign.id },
        data: {
          raisedAmount: { increment: contribution.amount },
          supporterCount: { increment: 1 },
        },
      });

      // Notify founder
      const startup = await prisma.startup.findFirst({
        where: { campaign: { id: contribution.campaign.id } },
        select: { founderId: true, title: true },
      });

      if (startup) {
        await prisma.notification.create({
          data: {
            type: 'CONTRIBUTION_RECEIVED',
            title: 'New Contribution!',
            message: `Your startup "${startup.title}" received a contribution of ₹${contribution.amount}`,
            userId: startup.founderId,
          },
        }).catch(() => {});
      }
    }

    return successResponse({ message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Payment verify error:', error);
    return errorResponse('Payment verification failed', 500);
  }
}
