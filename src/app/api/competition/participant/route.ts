import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

// GET /api/competition/participant — Get current user's participant profile
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, studentFee: true, founderFee: true, currentPhase: true, pageContent: true, finalsDate: true },
    });
    if (!competition) return errorResponse('No active competition', 404);

    const participant = await prisma.competitionParticipant.findUnique({
      where: { userId_competitionId: { userId: decoded.userId, competitionId: competition.id } },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
      },
    });

    if (!participant) {
      return errorResponse('No competition profile found. Please register first.', 404);
    }

    return successResponse({ participant, competition });
  } catch (error) {
    console.error('Get participant error:', error);
    return errorResponse('Failed to fetch profile', 500);
  }
}

// POST /api/competition/participant — Create competition profile for existing platform user
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { phone, participantType, college, company, designation, city, state } = await request.json();

    if (!phone || !participantType || !city || !state) {
      return errorResponse('Phone, participant type, city, and state are required', 400);
    }

    if (!['STUDENT', 'PROFESSIONAL'].includes(participantType)) {
      return errorResponse('Invalid participant type', 400);
    }

    const competition = await prisma.competition.findFirst({ where: { isActive: true } });
    if (!competition) return errorResponse('No active competition', 400);

    const existing = await prisma.competitionParticipant.findUnique({
      where: { userId_competitionId: { userId: decoded.userId, competitionId: competition.id } },
    });
    if (existing) return errorResponse('Already registered for this competition', 409);

    const participant = await prisma.competitionParticipant.create({
      data: {
        userId: decoded.userId,
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

    return successResponse(participant, 201);
  } catch (error) {
    console.error('Create participant error:', error);
    return errorResponse('Failed to create profile', 500);
  }
}
