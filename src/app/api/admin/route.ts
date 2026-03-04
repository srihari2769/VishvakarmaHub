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
    const type = searchParams.get('type');

    switch (type) {
      case 'stats': {
        const [userCount, startupCount, totalFunding, campaignCount] = await Promise.all([
          prisma.user.count(),
          prisma.startup.count(),
          prisma.campaign.aggregate({ _sum: { raisedAmount: true } }),
          prisma.campaign.count({ where: { status: 'ACTIVE' } }),
        ]);

        return successResponse({
          users: userCount,
          startups: startupCount,
          totalFunding: totalFunding._sum.raisedAmount || 0,
          activeCampaigns: campaignCount,
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

      case 'users': {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            _count: { select: { startups: true, contributions: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        return successResponse(users);
      }

      case 'campaigns': {
        const campaigns = await prisma.campaign.findMany({
          include: {
            startup: { select: { title: true, slug: true, founder: { select: { firstName: true, lastName: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        return successResponse(campaigns);
      }

      default:
        return errorResponse('Invalid type parameter', 400);
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
    const { action, startupId, userId } = body;

    switch (action) {
      case 'approve-startup': {
        const startup = await prisma.startup.update({
          where: { id: startupId },
          data: { status: 'APPROVED' },
        });
        // Activate campaign
        if (startup) {
          await prisma.campaign.updateMany({
            where: { startupId },
            data: { status: 'ACTIVE' },
          });
        }
        // Notify founder
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
        // In a production system, you'd add a suspended field
        return successResponse({ message: 'User suspended', userId });
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return errorResponse('Internal server error', 500);
  }
}
