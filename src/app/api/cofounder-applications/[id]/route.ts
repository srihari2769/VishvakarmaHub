import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

// PATCH - Accept or reject an application (founder only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return errorResponse('Authentication required', 401);
    }

    const payload = verifyToken(token);
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return errorResponse('Status must be ACCEPTED or REJECTED', 400);
    }

    const application = await prisma.cofounderApplication.findUnique({
      where: { id },
      include: {
        startup: {
          select: { founderId: true, title: true },
        },
      },
    });

    if (!application) {
      return errorResponse('Application not found', 404);
    }

    // Only the startup founder or admin can update
    if (application.startup.founderId !== payload.userId && payload.role !== 'ADMIN') {
      return errorResponse('Not authorized', 403);
    }

    const updated = await prisma.cofounderApplication.update({
      where: { id },
      data: { status },
      include: {
        applicant: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        startup: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    // Notify the applicant
    const statusText = status === 'ACCEPTED' ? 'accepted' : 'declined';
    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: `Co-Founder Application ${status === 'ACCEPTED' ? 'Accepted' : 'Declined'}`,
        message: `Your application to join "${application.startup.title}" has been ${statusText}.`,
        userId: application.applicantId,
        link: `/startup/${updated.startup.slug}`,
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Update co-founder application error:', error);
    return errorResponse('Failed to update application', 500);
  }
}
