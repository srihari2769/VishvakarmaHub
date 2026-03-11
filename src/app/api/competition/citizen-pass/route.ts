import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';
import { createRazorpayInstance, getRazorpayKeys } from '@/lib/razorpay';

export const maxDuration = 30;

// Generate unique pass number: VH-2026-XXXXXX
async function generatePassNumber(competitionId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.citizenPass.count({ where: { competitionId } });
  const num = String(count + 1).padStart(6, '0');
  return `VH-${year}-${num}`;
}

// POST /api/competition/citizen-pass — Create citizen pass + Razorpay order
export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, idProofType, idProofNumber } = await request.json();

    if (!name?.trim() || !phone?.trim() || !idProofType || !idProofNumber?.trim()) {
      return errorResponse('Name, phone, ID proof type and ID proof number are required', 400);
    }

    if (!['AADHAAR', 'PAN', 'VOTER'].includes(idProofType)) {
      return errorResponse('Invalid ID proof type', 400);
    }

    // Validate phone
    const phoneClean = phone.replace(/\s/g, '');
    if (!/^\+?\d{10,13}$/.test(phoneClean)) {
      return errorResponse('Invalid phone number', 400);
    }

    // Basic ID proof validation
    const idClean = idProofNumber.trim();
    if (idProofType === 'AADHAAR' && !/^\d{12}$/.test(idClean)) {
      return errorResponse('Aadhaar number must be 12 digits', 400);
    }
    if (idProofType === 'PAN' && !/^[A-Z]{5}\d{4}[A-Z]$/.test(idClean.toUpperCase())) {
      return errorResponse('Invalid PAN card number format', 400);
    }
    if (idProofType === 'VOTER' && idClean.length < 6) {
      return errorResponse('Invalid Voter ID format', 400);
    }

    // Get active competition
    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
    });
    if (!competition) {
      return errorResponse('No active competition found', 400);
    }

    const fee = 99;
    const passNumber = await generatePassNumber(competition.id);

    // Create citizen pass
    const pass = await prisma.citizenPass.create({
      data: {
        passNumber,
        name: name.trim(),
        phone: phoneClean,
        email: email?.trim() || null,
        idProofType,
        idProofNumber: idProofType === 'PAN' ? idClean.toUpperCase() : idClean,
        fee,
        paymentStatus: 'PENDING',
        competitionId: competition.id,
      },
    });

    // Create Razorpay order
    const razorpay = await createRazorpayInstance();
    const { keyId: rzpKeyId } = await getRazorpayKeys();

    const order = await razorpay.orders.create({
      amount: Math.round(fee * 100),
      currency: 'INR',
      receipt: pass.id,
      notes: {
        pass_id: pass.id,
        pass_number: passNumber,
        competition_id: competition.id,
        type: 'citizen_entry_pass',
      },
    });

    // Save order ID
    await prisma.citizenPass.update({
      where: { id: pass.id },
      data: { razorpayOrderId: order.id },
    });

    return successResponse({
      passId: pass.id,
      passNumber,
      orderId: order.id,
      amount: fee,
      currency: 'INR',
      keyId: rzpKeyId,
      competitionName: competition.name,
      prefill: {
        name: name.trim(),
        email: email?.trim() || '',
        contact: phoneClean,
      },
    });
  } catch (error) {
    console.error('Citizen pass creation error:', error);
    return errorResponse('Failed to create entry pass order', 500);
  }
}

// PUT /api/competition/citizen-pass — Verify payment
export async function PUT(request: NextRequest) {
  try {
    const { passId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!passId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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

    const pass = await prisma.citizenPass.findUnique({ where: { id: passId } });
    if (!pass) return errorResponse('Pass not found', 404);

    if (pass.paymentStatus === 'PAID') {
      return successResponse({ message: 'Payment already verified', pass });
    }

    const updatedPass = await prisma.citizenPass.update({
      where: { id: passId },
      data: {
        paymentStatus: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    return successResponse({ message: 'Payment verified', pass: updatedPass });
  } catch (error) {
    console.error('Citizen pass payment verification error:', error);
    return errorResponse('Failed to verify payment', 500);
  }
}
