import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (payload.role !== 'ADMIN') return errorResponse('Forbidden', 403);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats': {
        const [userCount, startupCount, totalFunding, pendingCount, withdrawalCount] = await Promise.all([
          prisma.user.count(),
          prisma.startup.count(),
          prisma.campaign.aggregate({ _sum: { raisedAmount: true } }),
          prisma.startup.count({ where: { status: 'PENDING' } }),
          prisma.withdrawal.count({ where: { status: 'PENDING' } }),
        ]);

        return successResponse({
          totalUsers: userCount,
          totalStartups: startupCount,
          totalFunding: totalFunding._sum.raisedAmount || 0,
          pendingReview: pendingCount,
          pendingWithdrawals: withdrawalCount,
        });
      }

      case 'pending-startups': {
        const pendingStartups = await prisma.startup.findMany({
          where: { status: 'PENDING' },
          include: {
            founder: { select: { firstName: true, lastName: true, email: true } },
            campaign: { select: { fundingGoal: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return successResponse(pendingStartups);
      }

      case 'all-startups': {
        const allStartups = await prisma.startup.findMany({
          include: {
            founder: { select: { firstName: true, lastName: true, email: true } },
            campaign: { select: { fundingGoal: true, raisedAmount: true, supporterCount: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        return successResponse(allStartups);
      }

      case 'users': {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            _count: { select: { startups: true, contributions: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        return successResponse(users);
      }

      case 'reports': {
        // Get platform-wide report data
        const [
          totalUsers,
          totalStartups,
          totalCampaigns,
          fundingAgg,
          contributionCount,
          recentContributions,
          startupsByStatus,
          campaignsByStatus,
          withdrawalStats,
        ] = await Promise.all([
          prisma.user.count(),
          prisma.startup.count(),
          prisma.campaign.count(),
          prisma.campaign.aggregate({ _sum: { raisedAmount: true }, _avg: { raisedAmount: true } }),
          prisma.contribution.count({ where: { status: 'COMPLETED' } }),
          prisma.contribution.findMany({
            where: { status: 'COMPLETED' },
            select: { amount: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 30,
          }),
          prisma.startup.groupBy({ by: ['status'], _count: { id: true } }),
          prisma.campaign.groupBy({ by: ['status'], _count: { id: true } }),
          prisma.withdrawal.groupBy({ by: ['status'], _count: { id: true }, _sum: { amount: true } }),
        ]);

        return successResponse({
          totalUsers,
          totalStartups,
          totalCampaigns,
          totalFunding: fundingAgg._sum.raisedAmount || 0,
          avgFunding: fundingAgg._avg.raisedAmount || 0,
          totalContributions: contributionCount,
          recentContributions,
          startupsByStatus: startupsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
          campaignsByStatus: campaignsByStatus.map((c) => ({ status: c.status, count: c._count.id })),
          withdrawalStats: withdrawalStats.map((w) => ({ status: w.status, count: w._count.id, amount: w._sum.amount || 0 })),
        });
      }

      case 'withdrawals': {
        const withdrawals = await prisma.withdrawal.findMany({
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            campaign: { select: { startup: { select: { title: true, slug: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        return successResponse(withdrawals);
      }

      default:
        return errorResponse('Invalid action parameter', 400);
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (payload.role !== 'ADMIN') return errorResponse('Forbidden', 403);

    const body = await request.json();
    const { action, startupId, userId, withdrawalId, adminNote } = body;

    switch (action) {
      case 'approve-startup': {
        const startup = await prisma.startup.update({
          where: { id: startupId },
          data: { status: 'APPROVED' },
        });
        if (startup) {
          await prisma.campaign.updateMany({
            where: { startupId },
            data: { status: 'ACTIVE' },
          });
        }
        await prisma.notification.create({
          data: {
            type: 'SYSTEM',
            title: 'Startup Approved!',
            message: 'Your startup has been approved and is now live on the platform.',
            userId: startup.founderId,
            link: `/startup/${startup.slug}`,
          },
        });
        return successResponse({ message: 'Startup approved' });
      }

      case 'reject-startup': {
        const startup = await prisma.startup.update({
          where: { id: startupId },
          data: { status: 'REJECTED' },
        });
        await prisma.notification.create({
          data: {
            type: 'SYSTEM',
            title: 'Startup Submission Update',
            message: 'Your startup submission has been reviewed and requires changes.',
            userId: startup.founderId,
          },
        });
        return successResponse({ message: 'Startup rejected' });
      }

      case 'suspend-user': {
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return errorResponse('User not found', 404);

        const updated = await prisma.user.update({
          where: { id: userId },
          data: { isActive: !targetUser.isActive },
        });
        return successResponse({
          message: updated.isActive ? 'User reactivated' : 'User suspended',
          isActive: updated.isActive,
        });
      }

      case 'approve-withdrawal': {
        const withdrawal = await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'APPROVED', adminNote, processedAt: new Date() },
        });
        await prisma.notification.create({
          data: {
            type: 'WITHDRAWAL',
            title: 'Withdrawal Approved',
            message: `Your withdrawal request of ₹${withdrawal.amount.toLocaleString()} has been approved. Funds will be transferred shortly.`,
            userId: withdrawal.userId,
          },
        });
        return successResponse({ message: 'Withdrawal approved' });
      }

      case 'reject-withdrawal': {
        const withdrawal = await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'REJECTED', adminNote, processedAt: new Date() },
        });
        await prisma.notification.create({
          data: {
            type: 'WITHDRAWAL',
            title: 'Withdrawal Rejected',
            message: `Your withdrawal request of ₹${withdrawal.amount.toLocaleString()} has been rejected. ${adminNote || ''}`,
            userId: withdrawal.userId,
          },
        });
        return successResponse({ message: 'Withdrawal rejected' });
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return errorResponse('Internal server error', 500);
  }
}
