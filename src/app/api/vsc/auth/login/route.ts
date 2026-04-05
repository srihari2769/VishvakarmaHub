import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';
import { validateEmail } from '@/lib/validations';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    if (!validateEmail(email)) {
      return errorResponse('Invalid email address', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true, password: true, role: true, avatar: true, isActive: true },
    });

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    if (!user.isActive) {
      return errorResponse('Your account has been suspended', 403);
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return errorResponse('Invalid email or password', 401);
    }

    // Check if they have a VSC participant profile
    const challenge = await prisma.vSCChallenge.findFirst({
      where: { isActive: true },
    });

    let participant = null;
    if (challenge) {
      participant = await prisma.vSCParticipant.findFirst({
        where: { userId: user.id, challengeId: challenge.id, paymentStatus: 'PAID' },
        orderBy: { attemptNumber: 'desc' },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;

    return successResponse({
      user: userWithoutPassword,
      participant,
      hasVSCProfile: !!participant,
      token,
    });
  } catch (error) {
    console.error('VSC login error:', error);
    return errorResponse('Login failed. Please try again.', 500);
  }
}
