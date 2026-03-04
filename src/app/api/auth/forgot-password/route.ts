import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists (don't reveal whether email exists for security)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // In production, this would send an actual email with a reset token
    if (user) {
      // TODO: Generate password reset token, store in DB, and send email
      // For now, log that a reset was requested
      console.log(`Password reset requested for user: ${user.email}`);
    }

    return NextResponse.json({
      message: 'If an account exists with that email, you will receive password reset instructions.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
