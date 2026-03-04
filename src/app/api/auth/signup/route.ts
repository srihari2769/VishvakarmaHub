import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, generateVerificationToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';
import { validateEmail, validatePassword } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, role } = body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return errorResponse('All fields are required', 400);
    }

    if (!validateEmail(email)) {
      return errorResponse('Invalid email address', 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.message, 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse('An account with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const verifyToken = generateVerificationToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role === 'FOUNDER' ? 'FOUNDER' : 'USER',
        verifyToken,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
      },
    });

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse({ user, token }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return errorResponse('Internal server error', 500);
  }
}
