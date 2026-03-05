import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

export const maxDuration = 30;

// POST /api/contact — Submit a contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return errorResponse('All fields are required', 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email address', 400);
    }

    if (subject.length > 200) {
      return errorResponse('Subject too long (max 200 characters)', 400);
    }

    if (message.length > 5000) {
      return errorResponse('Message too long (max 5000 characters)', 400);
    }

    const submission = await prisma.contactSubmission.create({
      data: { name, email, subject, message },
    });

    return successResponse({ id: submission.id }, 201);
  } catch (error) {
    console.error('Contact form error:', error);
    return errorResponse('Internal server error', 500);
  }
}
