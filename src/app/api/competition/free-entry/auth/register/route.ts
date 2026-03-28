import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, generateVerificationToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';
import { validateEmail, validatePassword } from '@/lib/validations';
import crypto from 'crypto';

export const maxDuration = 30;

function generateReferralCode(): string {
  return 'VH-FREE-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName, lastName, email, password, phone,
      participantType, college, company, designation, city, state,
      ref,
    } = body;

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

    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
    });
    if (!competition) {
      return errorResponse('No active competition found', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Check if already has a free entry for this competition
      const existingFreeEntry = await prisma.freeEntry.findUnique({
        where: { userId_competitionId: { userId: existingUser.id, competitionId: competition.id } },
      });
      if (existingFreeEntry) {
        return errorResponse('You are already registered for free entry. Please login instead.', 409);
      }

      // User exists but no free entry — create free entry record
      const referralCode = generateReferralCode();
      const freeEntry = await prisma.freeEntry.create({
        data: {
          userId: existingUser.id,
          competitionId: competition.id,
          phone,
          city,
          state,
          college: college || null,
          company: company || null,
          designation: designation || null,
          participantType,
          referralCode,
        },
      });

      const token = generateToken({
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      });

      // If referred by someone, track it
      if (ref) {
        await trackReferral(ref, existingUser.id);
      }

      return successResponse({
        user: { id: existingUser.id, email: existingUser.email, firstName: existingUser.firstName, lastName: existingUser.lastName, role: existingUser.role, avatar: existingUser.avatar },
        freeEntry,
        token,
      }, 201);
    }

    // Create new user + free entry
    const hashedPassword = await hashPassword(password);
    const verifyToken = generateVerificationToken();
    const referralCode = generateReferralCode();

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

      const freeEntry = await tx.freeEntry.create({
        data: {
          userId: user.id,
          competitionId: competition.id,
          phone,
          city,
          state,
          college: college || null,
          company: company || null,
          designation: designation || null,
          participantType,
          referralCode,
        },
      });

      return { user, freeEntry };
    });

    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    // If referred by someone, track it
    if (ref) {
      await trackReferral(ref, result.user.id);
    }

    return successResponse({
      user: result.user,
      freeEntry: result.freeEntry,
      token,
    }, 201);
  } catch (error) {
    console.error('Free entry registration error:', error);
    return errorResponse('Registration failed. Please try again.', 500);
  }
}

async function trackReferral(referralCode: string, referredUserId: string) {
  try {
    const freeEntry = await prisma.freeEntry.findUnique({
      where: { referralCode },
    });
    if (!freeEntry || freeEntry.userId === referredUserId) return;

    // Don't create duplicate referral
    const existing = await prisma.freeEntryReferral.findUnique({
      where: { freeEntryId_referredUserId: { freeEntryId: freeEntry.id, referredUserId } },
    });
    if (existing) return;

    await prisma.freeEntryReferral.create({
      data: {
        freeEntryId: freeEntry.id,
        referredUserId,
        paymentVerified: false,
      },
    });
  } catch (err) {
    console.error('Referral tracking error:', err);
  }
}
