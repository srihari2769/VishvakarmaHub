import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const startup = await prisma.startup.findUnique({
      where: { slug },
      include: {
        founder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            linkedIn: true,
          },
        },
        campaign: {
          include: {
            rewardTiers: {
              orderBy: { amount: 'asc' },
            },
          },
        },
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
            replies: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, avatar: true },
                },
              },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        documents: {
          select: { type: true, status: true },
        },
        _count: {
          select: {
            comments: true,
            savedBy: true,
          },
        },
      },
    });

    if (!startup) {
      return errorResponse('Startup not found', 404);
    }

    return successResponse(startup);
  } catch (error) {
    console.error('Get startup error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    const { slug } = await params;

    const startup = await prisma.startup.findUnique({
      where: { slug },
      select: { id: true, founderId: true },
    });

    if (!startup) return errorResponse('Startup not found', 404);
    if (startup.founderId !== payload.userId && payload.role !== 'ADMIN') {
      return errorResponse('Not authorized to edit this startup', 403);
    }

    const body = await request.json();
    const {
      title, shortDescription, problemDescription, targetAudience,
      solutionExplanation, innovationUniqueness, category, location,
      productStage, logo, pitchDeck, demoVideo, screenshots,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (problemDescription !== undefined) updateData.problemDescription = problemDescription;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (solutionExplanation !== undefined) updateData.solutionExplanation = solutionExplanation;
    if (innovationUniqueness !== undefined) updateData.innovationUniqueness = innovationUniqueness;
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (productStage !== undefined) updateData.productStage = productStage;
    if (logo !== undefined) updateData.logo = logo;
    if (pitchDeck !== undefined) updateData.pitchDeck = pitchDeck;
    if (demoVideo !== undefined) updateData.demoVideo = demoVideo;
    if (screenshots !== undefined) updateData.screenshots = screenshots;

    const updated = await prisma.startup.update({
      where: { id: startup.id },
      data: updateData,
      include: {
        founder: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        campaign: { include: { rewardTiers: true } },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Update startup error:', error);
    return errorResponse('Internal server error', 500);
  }
}
