import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export const maxDuration = 30;

function generateTeamCode(): string {
  return 'VSC-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// GET — get user's team or team by code
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    if (code) {
      const team = await prisma.vSCTeam.findUnique({
        where: { code },
        include: {
          members: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
        },
      });
      if (!team) return errorResponse('Team not found', 404);
      return successResponse({ team });
    }

    // Get user's teams
    const memberships = await prisma.vSCTeamMember.findMany({
      where: { userId: decoded.userId },
      include: {
        team: {
          include: {
            members: {
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    return successResponse({
      teams: memberships.map(m => ({
        ...m.team,
        myRole: m.role,
      })),
      teamEntryFee: challenge.teamEntryFee,
    });
  } catch (error) {
    console.error('Teams GET error:', error);
    return errorResponse('Failed to fetch teams', 500);
  }
}

// POST — create team (captain pays ₹249)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { name } = body;
    if (!name || name.trim().length < 2) return errorResponse('Team name required (min 2 chars)', 400);

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    const razorpay = await createRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: challenge.teamEntryFee * 100,
      currency: 'INR',
      receipt: `vsc_team_${decoded.userId.slice(-6)}_${Date.now()}`,
      notes: { userId: decoded.userId, teamName: name },
    });

    const code = generateTeamCode();
    const team = await prisma.vSCTeam.create({
      data: {
        challengeId: challenge.id,
        name: name.trim(),
        code,
        captainId: decoded.userId,
        entryFee: challenge.teamEntryFee,
        razorpayPaymentId: order.id,
        paymentStatus: 'PENDING',
        isActive: false,
      },
    });

    const { keyId } = await getRazorpayKeys();
    return successResponse({
      orderId: order.id,
      teamId: team.id,
      teamCode: code,
      amount: challenge.teamEntryFee * 100,
      currency: 'INR',
      keyId,
    });
  } catch (error) {
    console.error('Teams POST error:', error);
    return errorResponse('Failed to create team', 500);
  }
}

// PATCH — verify payment OR join team
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { action } = body;

    if (action === 'verify') {
      const { teamId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (!teamId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return errorResponse('Missing payment details', 400);
      }

      const team = await prisma.vSCTeam.findUnique({ where: { id: teamId } });
      if (!team || team.captainId !== decoded.userId) return errorResponse('Team not found', 404);

      const { keySecret } = await getRazorpayKeys();
      const sig = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      if (sig !== razorpay_signature) return errorResponse('Payment verification failed', 400);

      const updated = await prisma.vSCTeam.update({
        where: { id: teamId },
        data: { razorpayPaymentId: razorpay_payment_id, paymentStatus: 'PAID', isActive: true },
      });

      // Add captain as member
      await prisma.vSCTeamMember.create({
        data: { teamId, userId: decoded.userId, role: 'CAPTAIN' },
      });

      return successResponse({ team: updated, message: 'Team created! Share code: ' + updated.code });
    }

    if (action === 'join') {
      const { code } = body;
      if (!code) return errorResponse('Team code required', 400);

      const team = await prisma.vSCTeam.findUnique({
        where: { code },
        include: { _count: { select: { members: true } } },
      });
      if (!team || !team.isActive || team.paymentStatus !== 'PAID') {
        return errorResponse('Team not found or not active', 404);
      }
      if (team._count.members >= 3) return errorResponse('Team is full (max 3 members)', 400);

      const existing = await prisma.vSCTeamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: decoded.userId } },
      });
      if (existing) return errorResponse('Already a member', 400);

      await prisma.vSCTeamMember.create({
        data: { teamId: team.id, userId: decoded.userId, role: 'MEMBER' },
      });

      return successResponse({ message: `Joined team "${team.name}"!`, teamCode: team.code });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    console.error('Teams PATCH error:', error);
    return errorResponse('Failed', 500);
  }
}
