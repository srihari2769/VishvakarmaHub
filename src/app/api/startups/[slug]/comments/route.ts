import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// POST /api/startups/[slug]/comments — Add a comment to a startup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { slug } = await params;
    const { content, parentId } = await request.json();

    if (!content || !content.trim()) {
      return errorResponse('Comment content is required', 400);
    }

    if (content.length > 2000) {
      return errorResponse('Comment is too long (max 2000 characters)', 400);
    }

    const startup = await prisma.startup.findUnique({
      where: { slug },
      select: { id: true, founderId: true, title: true },
    });

    if (!startup) {
      return errorResponse('Startup not found', 404);
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: decoded.userId,
        startupId: startup.id,
        parentId: parentId || null,
      },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } },
      },
    });

    // Notify the founder if commenter is not the founder
    if (startup.founderId !== decoded.userId) {
      await prisma.notification.create({
        data: {
          type: 'SYSTEM',
          title: 'New Comment',
          message: `Someone commented on "${startup.title}"`,
          userId: startup.founderId,
        },
      }).catch(() => {});
    }

    return successResponse(comment, 201);
  } catch (error) {
    console.error('Create comment error:', error);
    return errorResponse('Failed to post comment', 500);
  }
}
