import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// POST - upvote/unvote an entry during VOTING phase
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json(errorResponse('Invalid token'), { status: 401 });

    const { entryId } = await request.json();
    if (!entryId) {
      return NextResponse.json(errorResponse('Entry ID is required'), { status: 400 });
    }

    const entry = await prisma.competitionEntry.findUnique({
      where: { id: entryId },
      include: { competition: true },
    });

    if (!entry) {
      return NextResponse.json(errorResponse('Entry not found'), { status: 404 });
    }

    if (entry.competition.currentPhase !== 'VOTING') {
      return NextResponse.json(errorResponse('Voting is not currently open'), { status: 400 });
    }

    // Check if already voted
    const existingVote = await prisma.competitionVote.findUnique({
      where: { userId_entryId: { userId: decoded.userId, entryId } },
    });

    if (existingVote) {
      // Remove vote
      await prisma.$transaction([
        prisma.competitionVote.delete({ where: { id: existingVote.id } }),
        prisma.competitionEntry.update({
          where: { id: entryId },
          data: { upvotes: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json(successResponse({ voted: false }));
    } else {
      // Add vote
      await prisma.$transaction([
        prisma.competitionVote.create({
          data: { userId: decoded.userId, entryId },
        }),
        prisma.competitionEntry.update({
          where: { id: entryId },
          data: { upvotes: { increment: 1 } },
        }),
      ]);
      return NextResponse.json(successResponse({ voted: true }));
    }
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(errorResponse('Failed to process vote'), { status: 500 });
  }
}
