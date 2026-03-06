import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// POST - seed the initial competition (admin only, one-time)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403);
    }

    // Check if competition already exists - return it as success
    const existing = await prisma.competition.findFirst({
      where: { slug: 'vishvakarma-innovation-challenge-2026' },
    });
    if (existing) {
      return successResponse(existing);
    }

    const competition = await prisma.competition.create({
      data: {
        name: 'Vishvakarma Innovation Challenge 2026',
        tagline: 'Build the Future. Launch Your Startup.',
        slug: 'vishvakarma-innovation-challenge-2026',
        description: `The Vishvakarma Innovation Challenge 2026 is a national-level startup competition designed to discover, showcase, and launch the most promising innovations from across India. Open to students, engineers, founders, innovators, and researchers — this is your stage to turn bold ideas into real startups.\n\nWhether you're at the idea stage or have a working prototype, this competition gives you access to expert evaluation, public visibility, community engagement, and a platform to pitch to top founders, investors, and industry experts.\n\nThe top startups will be selected through a rigorous multi-phase process including jury screening, public voting, and a live pitch round.`,
        currentPhase: 'REGISTRATION',
        registrationStart: new Date('2026-03-06'),
        registrationEnd: new Date('2026-04-05'),
        screeningEnd: new Date('2026-04-20'),
        votingEnd: new Date('2026-05-05'),
        finalsDate: new Date('2026-05-15'),
        isActive: true,
      },
    });

    return successResponse(competition, 201);
  } catch (error) {
    console.error('Seed competition error:', error);
    return errorResponse('Failed to seed competition', 500);
  }
}
