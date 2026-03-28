import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';

export const maxDuration = 30;

// POST /api/competition/idea-submission — Submit idea + create Razorpay order
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const {
      ideaTitle, ideaDescription, ideaCategory, problemStatement,
      solution, targetAudience, uniqueness, productStage,
      pitchDeck, demoVideo, teamName, teamSize, teamMembers,
      wantsBooth,
    } = body;

    // Validate required idea fields
    if (!ideaTitle || !ideaDescription || !ideaCategory || !problemStatement || !solution) {
      return errorResponse('Idea title, description, category, problem statement, and solution are required', 400);
    }

    const parsedTeamSize = Math.max(1, parseInt(teamSize) || 1);
    if (parsedTeamSize > 10) {
      return errorResponse('Maximum team size is 10 members', 400);
    }

    // Validate team members if team size > 1
    if (parsedTeamSize > 1) {
      if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length !== parsedTeamSize - 1) {
        return errorResponse(`Please provide details for all ${parsedTeamSize - 1} additional team member(s)`, 400);
      }
      for (let i = 0; i < teamMembers.length; i++) {
        if (!teamMembers[i].name || !teamMembers[i].email) {
          return errorResponse(`Name and email are required for team member ${i + 1}`, 400);
        }
      }
    }

    // Get competition
    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
    });
    if (!competition) return errorResponse('No active competition', 400);

    // Get participant
    const participant = await prisma.competitionParticipant.findUnique({
      where: { userId_competitionId: { userId: decoded.userId, competitionId: competition.id } },
    });
    if (!participant) {
      return errorResponse('Please register for the competition first', 400);
    }

    if (participant.paymentStatus === 'PAID') {
      return errorResponse('You have already submitted and paid. Check your dashboard.', 400);
    }

    // Calculate fee
    const baseFee = participant.participantType === 'STUDENT'
      ? competition.studentFee
      : competition.founderFee;
    const boothFee = wantsBooth ? (competition.boothPrice || 5000) : 0;
    const totalFee = baseFee * parsedTeamSize + boothFee;

    // Update participant with idea data (PENDING payment)
    const updated = await prisma.competitionParticipant.update({
      where: { id: participant.id },
      data: {
        ideaTitle,
        ideaDescription,
        ideaCategory,
        problemStatement,
        solution,
        targetAudience: targetAudience || null,
        uniqueness: uniqueness || null,
        productStage: productStage || null,
        pitchDeck: pitchDeck || null,
        demoVideo: demoVideo || null,
        teamName: teamName || null,
        teamSize: parsedTeamSize,
        teamMembers: parsedTeamSize > 1 ? teamMembers : null,
        totalFee,
        wantsBooth: !!wantsBooth,
        boothFee: wantsBooth ? boothFee : null,
        status: 'IDEA_SUBMITTED',
        participationMode: 'IDEA_SUBMISSION',
      },
    });

    // Get user for Razorpay prefill
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });

    // Create Razorpay order
    const razorpay = await createRazorpayInstance();
    const { keyId: rzpKeyId } = await getRazorpayKeys();

    const order = await razorpay.orders.create({
      amount: Math.round(totalFee * 100),
      currency: 'INR',
      receipt: updated.id,
      notes: {
        participant_id: updated.id,
        competition_id: competition.id,
        type: 'competition_idea_submission',
      },
    });

    // Save order ID
    await prisma.competitionParticipant.update({
      where: { id: updated.id },
      data: { razorpayOrderId: order.id },
    });

    return successResponse({
      participantId: updated.id,
      orderId: order.id,
      amount: totalFee,
      baseFee,
      teamSize: parsedTeamSize,
      currency: 'INR',
      keyId: rzpKeyId,
      competitionName: competition.name,
      prefill: {
        name: user ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
        contact: user?.phone || participant.phone || '',
      },
    });
  } catch (error) {
    console.error('Idea submission error:', error);
    return errorResponse('Failed to submit idea', 500);
  }
}

// PUT /api/competition/idea-submission — Verify payment after Razorpay checkout
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { participantId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!participantId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Missing payment verification data', 400);
    }

    // Verify signature
    const { keySecret: secret } = await getRazorpayKeys();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return errorResponse('Invalid payment signature', 400);
    }

    // Verify participant belongs to user
    const participant = await prisma.competitionParticipant.findUnique({
      where: { id: participantId },
      include: { competition: { select: { name: true } } },
    });

    if (!participant || participant.userId !== decoded.userId) {
      return errorResponse('Participant not found', 404);
    }

    if (participant.paymentStatus === 'PAID') {
      return successResponse({ message: 'Payment already verified' });
    }

    // Update to paid
    await prisma.competitionParticipant.update({
      where: { id: participantId },
      data: {
        paymentStatus: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Competition Registration Confirmed!',
        message: `Your idea "${participant.ideaTitle}" has been submitted for ${participant.competition.name}. Payment of ₹${participant.totalFee} received. Team size: ${participant.teamSize}.`,
        link: '/competition/dashboard',
        userId: decoded.userId,
      },
    });

    return successResponse({ message: 'Payment confirmed! Your idea has been submitted successfully.' });
  } catch (error) {
    console.error('Payment verification error:', error);
    return errorResponse('Failed to verify payment', 500);
  }
}
