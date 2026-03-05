import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

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
