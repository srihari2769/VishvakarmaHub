import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, comparePassword, generateToken, generateVerificationToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';
import { validateEmail, validatePassword } from '@/lib/validations';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName, lastName, email, password, phone,
      college, city, state,
    } = body;

    if (!firstName || !lastName || !email || !password || !phone || !city || !state) {
      return errorResponse('All required fields must be filled', 400);
    }

    if (!validateEmail(email)) {
      return errorResponse('Invalid email address', 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.message, 400);
    }

    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      return errorResponse('Invalid Indian phone number', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true, password: true, role: true, avatar: true },
    });

    if (existingUser) {
      // User already has an account (e.g. from competition) — verify password and return token
      const passwordMatch = await comparePassword(password, existingUser.password);
      if (!passwordMatch) {
        return errorResponse('An account with this email already exists. Please use the correct password or use VSC Login.', 409);
      }

      // Check if already registered for an active VSC challenge
      const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
      if (challenge) {
        const existingParticipant = await prisma.vSCParticipant.findFirst({
          where: { userId: existingUser.id, challengeId: challenge.id, paymentStatus: 'PAID' },
        });
        if (existingParticipant) {
          return errorResponse('You are already registered for this challenge. Please login instead.', 409);
        }
      }

      // Password matches — return existing user with token so they can proceed to VSC registration
      const { password: _, ...userWithoutPassword } = existingUser;
      const existingToken = generateToken({
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      });

      return successResponse({
        user: userWithoutPassword,
        token: existingToken,
        existingAccount: true,
      }, 200);
    }

    const hashedPassword = await hashPassword(password);
    const verifyToken = generateVerificationToken();

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        role: 'USER',
        verifyToken,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse({
      user,
      token,
    }, 201);
  } catch (error) {
    console.error('VSC registration error:', error);
    return errorResponse('Registration failed. Please try again.', 500);
  }
}
