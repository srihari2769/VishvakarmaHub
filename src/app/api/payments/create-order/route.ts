import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

// POST /api/payments/create-order — Create a Razorpay order for a contribution
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { startupId, amount, rewardTierId } = await request.json();

    if (!startupId || !amount || amount < 1) {
      return errorResponse('startupId and amount are required', 400);
    }

    // Get startup with campaign
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      include: { campaign: true },
    });

    if (!startup || !startup.campaign) {
      return errorResponse('Startup or campaign not found', 404);
    }

    if (startup.campaign.status !== 'ACTIVE') {
      return errorResponse('Campaign is not active', 400);
    }

    // Create contribution record with PENDING status
    const contribution = await prisma.contribution.create({
      data: {
        amount,
        paymentMethod: 'RAZORPAY',
        status: 'PENDING',
        userId: decoded.userId,
        campaignId: startup.campaign.id,
        rewardTierId: rewardTierId || null,
      },
    });

    // In production, create actual Razorpay order:
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({
    //   key_id: process.env.RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_SECRET,
    // });
    // const order = await razorpay.orders.create({
    //   amount: amount * 100, // Razorpay uses paise
    //   currency: 'INR',
    //   receipt: contribution.id,
    //   notes: { contribution_id: contribution.id, startup_id: startupId },
    // });

    const orderId = `order_${contribution.id.slice(0, 16)}`;

    return successResponse({
      orderId,
      contributionId: contribution.id,
      amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      prefill: {
        name: `${decoded.userId}`,
      },
      notes: {
        contribution_id: contribution.id,
        startup_id: startupId,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return errorResponse('Failed to create payment order', 500);
  }
}
