import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return successResponse(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    const body = await request.json();
    const { notificationId } = body;

    if (notificationId) {
      // Mark single notification as read
      await prisma.notification.update({
        where: { id: notificationId, userId: payload.userId },
        data: { read: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: payload.userId, read: false },
        data: { read: true },
      });
    }

    return successResponse({ message: 'Notifications updated' });
  } catch (error) {
    console.error('Update notifications error:', error);
    return errorResponse('Internal server error', 500);
  }
}
