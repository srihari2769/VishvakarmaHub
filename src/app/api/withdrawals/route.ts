import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

// GET - Fetch user's withdrawal requests
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: payload.userId },
      include: {
        campaign: {
          select: {
            startup: { select: { title: true, slug: true } },
            raisedAmount: true,
            fundingGoal: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(withdrawals);
  } catch (error) {
    console.error('Withdrawal fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// POST - Create a withdrawal request
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    const body = await request.json();
    const { campaignId, amount, bankName, accountNumber, ifscCode, accountHolder, note } = body;

    // Validate required fields
    if (!campaignId || !amount || !bankName || !accountNumber || !ifscCode || !accountHolder) {
      return errorResponse('All bank details are required', 400);
    }

    if (amount <= 0) {
      return errorResponse('Amount must be greater than 0', 400);
    }

    // Verify campaign belongs to this user
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { startup: { select: { founderId: true, title: true } } },
    });

    if (!campaign) return errorResponse('Campaign not found', 404);
    if (campaign.startup.founderId !== payload.userId) {
      return errorResponse('You can only withdraw from your own campaigns', 403);
    }

    // Check available balance (raised - already withdrawn)
    const existingWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        campaignId,
        status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] },
      },
      _sum: { amount: true },
    });

    const alreadyWithdrawn = existingWithdrawals._sum.amount || 0;
    const availableBalance = campaign.raisedAmount - alreadyWithdrawn;

    if (amount > availableBalance) {
      return errorResponse(
        `Insufficient balance. Available: ₹${availableBalance.toLocaleString()}`,
        400
      );
    }

    // Check for pending withdrawal on same campaign
    const pendingExists = await prisma.withdrawal.findFirst({
      where: { campaignId, userId: payload.userId, status: 'PENDING' },
    });

    if (pendingExists) {
      return errorResponse('You already have a pending withdrawal for this campaign', 400);
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        amount,
        bankName,
        accountNumber,
        ifscCode,
        accountHolder,
        note,
        userId: payload.userId,
        campaignId,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        type: 'WITHDRAWAL' as const,
        title: 'New Withdrawal Request',
        message: `${accountHolder} requested ₹${amount.toLocaleString()} withdrawal from "${campaign.startup.title}"`,
        userId: admin.id,
        link: '/admin',
      })),
    });

    return successResponse(withdrawal, 201);
  } catch (error) {
    console.error('Withdrawal create error:', error);
    return errorResponse('Internal server error', 500);
  }
}
