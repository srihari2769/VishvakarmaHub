import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    const body = await request.json();
    const { campaignId, amount, paymentMethod, transactionId, rewardTierId } = body;

    if (!campaignId || !amount || !paymentMethod) {
      return errorResponse('Campaign ID, amount, and payment method are required', 400);
    }

    // Verify campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { startup: { select: { title: true } } },
    });

    if (!campaign || campaign.status !== 'ACTIVE') {
      return errorResponse('Campaign not found or is not active', 404);
    }

    // Create contribution
    const contribution = await prisma.contribution.create({
      data: {
        amount: parseFloat(amount),
        paymentMethod,
        transactionId,
        status: transactionId ? 'COMPLETED' : 'PENDING',
        userId: payload.userId,
        campaignId,
        rewardTierId,
      },
    });

    // Update campaign totals if payment completed
    if (transactionId) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          raisedAmount: { increment: parseFloat(amount) },
          supporterCount: { increment: 1 },
        },
      });

      // Update reward tier claimed count
      if (rewardTierId) {
        await prisma.rewardTier.update({
          where: { id: rewardTierId },
          data: { claimedCount: { increment: 1 } },
        });
      }

      // Create notification for founder
      const startup = await prisma.startup.findFirst({
        where: { campaign: { id: campaignId } },
      });

      if (startup) {
        await prisma.notification.create({
          data: {
            type: 'CONTRIBUTION_RECEIVED',
            title: 'New Contribution!',
            message: `Someone contributed ₹${amount} to your campaign "${campaign.startup.title}"`,
            userId: startup.founderId,
            link: `/startup-dashboard`,
          },
        });
      }
    }

    return successResponse(contribution, 201);
  } catch (error) {
    console.error('Create contribution error:', error);
    return errorResponse('Internal server error', 500);
  }
}
