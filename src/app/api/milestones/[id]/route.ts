import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    const { id } = await params;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { startup: { select: { founderId: true } } },
    });

    if (!milestone) return errorResponse('Milestone not found', 404);
    if (milestone.startup.founderId !== payload.userId && payload.role !== 'ADMIN') {
      return errorResponse('Not authorized', 403);
    }

    const body = await request.json();
    const { status } = body;

    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return errorResponse('Invalid status', 400);
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status,
        completedDate: status === 'COMPLETED' ? new Date() : null,
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Update milestone error:', error);
    return errorResponse('Internal server error', 500);
  }
}
