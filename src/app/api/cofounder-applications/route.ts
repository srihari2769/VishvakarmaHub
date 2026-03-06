import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

// POST - Submit a co-founder application
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return errorResponse('Authentication required', 401);
    }

    const payload = verifyToken(token);

    const body = await request.json();
    const { startupId, role, message, experience, portfolio, linkedIn } = body;

    if (!startupId || !role || !message || !experience) {
      return errorResponse('Startup ID, role, message, and experience are required', 400);
    }

    // Check startup exists and is looking for co-founders
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: {
        id: true,
        founderId: true,
        lookingForCofounder: true,
        cofounderRoles: true,
        title: true,
      },
    });

    if (!startup) {
      return errorResponse('Startup not found', 404);
    }

    if (!startup.lookingForCofounder) {
      return errorResponse('This startup is not looking for co-founders', 400);
    }

    // Can't apply to own startup
    if (startup.founderId === payload.userId) {
      return errorResponse('You cannot apply to your own startup', 400);
    }

    // Check if role is valid for this startup
    if (!startup.cofounderRoles.includes(role)) {
      return errorResponse('This role is not available for this startup', 400);
    }

    // Check for existing application
    const existing = await prisma.cofounderApplication.findUnique({
      where: {
        applicantId_startupId: {
          applicantId: payload.userId,
          startupId,
        },
      },
    });

    if (existing) {
      return errorResponse('You have already applied to this startup', 400);
    }

    const application = await prisma.cofounderApplication.create({
      data: {
        role,
        message,
        experience,
        portfolio: portfolio || null,
        linkedIn: linkedIn || null,
        applicantId: payload.userId,
        startupId,
      },
      include: {
        startup: {
          select: { title: true, slug: true },
        },
      },
    });

    // Notify the founder
    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'New Co-Founder Application',
        message: `Someone applied to join "${startup.title}" as a ${role}.`,
        userId: startup.founderId,
        link: `/startup-dashboard?tab=applications`,
      },
    });

    return successResponse(application, 201);
  } catch (error) {
    console.error('Co-founder application error:', error);
    return errorResponse('Failed to submit application', 500);
  }
}

// GET - Get applications (for applicant: their apps, for founder: apps to their startups)
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return errorResponse('Authentication required', 401);
    }

    const payload = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'founder' or 'applicant'
    const startupId = searchParams.get('startupId');

    if (view === 'founder') {
      // Founder view: get all applications to their startups
      const where: Record<string, unknown> = {
        startup: { founderId: payload.userId },
      };
      if (startupId) {
        where.startupId = startupId;
      }

      const applications = await prisma.cofounderApplication.findMany({
        where,
        include: {
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              linkedIn: true,
              bio: true,
            },
          },
          startup: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return successResponse(applications);
    } else {
      // Applicant view: get their own applications
      const applications = await prisma.cofounderApplication.findMany({
        where: { applicantId: payload.userId },
        include: {
          startup: {
            select: {
              id: true,
              title: true,
              slug: true,
              logo: true,
              thumbnail: true,
              founder: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return successResponse(applications);
    }
  } catch (error) {
    console.error('Get co-founder applications error:', error);
    return errorResponse('Failed to fetch applications', 500);
  }
}
