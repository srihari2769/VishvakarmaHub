import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// GET - get active competition (public)
export async function GET() {
  try {
    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
      include: {
        judges: true,
        entries: {
          where: {
            status: {
              in: ['SELECTED_TOP200', 'PUBLIC_VOTING', 'FINALIST', 'WINNER'],
            },
          },
          include: {
            startup: {
              select: {
                id: true,
                title: true,
                slug: true,
                shortDescription: true,
                category: true,
                location: true,
                productStage: true,
                logo: true,
                thumbnail: true,
                founder: {
                  select: { firstName: true, lastName: true, avatar: true },
                },
              },
            },
            user: {
              select: { firstName: true, lastName: true },
            },
            _count: { select: { votes: true } },
          },
          orderBy: [{ upvotes: 'desc' }, { totalScore: 'desc' }],
        },
        _count: { select: { entries: true } },
      },
    });

    if (!competition) {
      return NextResponse.json(errorResponse('No active competition found'), { status: 404 });
    }

    return NextResponse.json(successResponse(competition));
  } catch (error) {
    console.error('Competition fetch error:', error);
    return NextResponse.json(errorResponse('Failed to fetch competition'), { status: 500 });
  }
}

// POST - register startup for competition (authenticated)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json(errorResponse('Invalid token'), { status: 401 });

    const { startupId } = await request.json();
    if (!startupId) {
      return NextResponse.json(errorResponse('Startup ID is required'), { status: 400 });
    }

    // Check active competition
    const competition = await prisma.competition.findFirst({
      where: { isActive: true, currentPhase: 'REGISTRATION' },
    });
    if (!competition) {
      return NextResponse.json(errorResponse('Registration is not currently open'), { status: 400 });
    }

    // Verify startup belongs to user and is approved
    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) {
      return NextResponse.json(errorResponse('Startup not found'), { status: 404 });
    }
    if (startup.founderId !== decoded.userId) {
      return NextResponse.json(errorResponse('You can only register your own startup'), { status: 403 });
    }
    if (startup.status !== 'APPROVED' && startup.status !== 'ACTIVE') {
      return NextResponse.json(errorResponse('Only approved startups can be registered'), { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.competitionEntry.findUnique({
      where: { startupId_competitionId: { startupId, competitionId: competition.id } },
    });
    if (existing) {
      return NextResponse.json(errorResponse('This startup is already registered'), { status: 400 });
    }

    const entry = await prisma.competitionEntry.create({
      data: {
        startupId,
        competitionId: competition.id,
        userId: decoded.userId,
      },
      include: {
        startup: { select: { title: true, slug: true } },
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Competition Registration Confirmed',
        message: `Your startup "${entry.startup.title}" has been registered for ${competition.name}.`,
        link: '/competition',
        userId: decoded.userId,
      },
    });

    return NextResponse.json(successResponse(entry), { status: 201 });
  } catch (error) {
    console.error('Competition registration error:', error);
    return NextResponse.json(errorResponse('Failed to register for competition'), { status: 500 });
  }
}
