import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, generateVerificationToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';
import { validateEmail, validatePassword } from '@/lib/validations';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName, lastName, email, password, phone,
      participantType, college, company, designation, city, state,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !participantType || !city || !state) {
      return errorResponse('All required fields must be filled', 400);
    }

    if (!validateEmail(email)) {
      return errorResponse('Invalid email address', 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.message, 400);
    }

    if (!['STUDENT', 'PROFESSIONAL'].includes(participantType)) {
      return errorResponse('Participant type must be STUDENT or PROFESSIONAL', 400);
    }

    if (participantType === 'STUDENT' && !college) {
      return errorResponse('College/University is required for students', 400);
    }

    // Get active competition
    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
    });
    if (!competition) {
      return errorResponse('No active competition found', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Check if already registered for this competition
      const existingParticipant = await prisma.competitionParticipant.findUnique({
        where: { userId_competitionId: { userId: existingUser.id, competitionId: competition.id } },
      });
      if (existingParticipant) {
        return errorResponse('You are already registered for this competition. Please login instead.', 409);
      }
      return errorResponse('An account with this email already exists. Please use Competition Login.', 409);
    }

    // Create user + participant in a transaction
    const hashedPassword = await hashPassword(password);
    const verifyToken = generateVerificationToken();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
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

      const participant = await tx.competitionParticipant.create({
        data: {
          userId: user.id,
          competitionId: competition.id,
          phone,
          participantType,
          college: college || null,
          company: company || null,
          designation: designation || null,
          city,
          state,
        },
      });

      return { user, participant };
    });

    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    return successResponse({
      user: result.user,
      participant: result.participant,
      token,
    }, 201);
  } catch (error) {
    console.error('Competition registration error:', error);
    return errorResponse('Registration failed. Please try again.', 500);
  }
}
