import { NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/utils';

export const maxDuration = 30;

// Default sponsor tier pricing (used when pageContent doesn't override)
const TIER_PRICES: Record<string, number> = {
  TITLE: 100000,
  PLATINUM: 75000,
  GOLD: 50000,
  SILVER: 35000,
  STARTUP_PARTNER: 25000,
  INNOVATION_PARTNER: 15000,
  COMMUNITY_PARTNER: 10000,
  STAGE: 40000,
  MEDIA: 30000,
  AWARD: 20000,
};

const TIER_LABELS: Record<string, string> = {
  TITLE: 'Title Sponsor',
  PLATINUM: 'Platinum Sponsor',
  GOLD: 'Gold Sponsor',
  SILVER: 'Silver Sponsor',
  STARTUP_PARTNER: 'Startup Partner',
  INNOVATION_PARTNER: 'Innovation Partner',
  COMMUNITY_PARTNER: 'Community Partner',
  STAGE: 'Stage Sponsor',
  MEDIA: 'Media Sponsor',
  AWARD: 'Award Sponsor',
};

// Generate unique sponsor ID: SPR-2026-000001
async function generateSponsorId(competitionId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.sponsorRegistration.count({ where: { competitionId } });
  const num = String(count + 1).padStart(6, '0');
  return `SPR-${year}-${num}`;
}

// Parse price from pageContent string like "₹75,000" → 75000
function parsePriceFromString(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[₹,\s]/g, '');
  // Handle range like "1,00,000 – 2,00,000" → take the first value
  const parts = cleaned.split(/[–-]/);
  const num = parseInt(parts[0], 10);
  return isNaN(num) ? null : num;
}

// GET /api/competition/sponsor — Get tier info for a specific tier
export async function GET(request: NextRequest) {
  try {
    const tier = request.nextUrl.searchParams.get('tier');
    if (!tier || !TIER_PRICES[tier]) {
      return errorResponse('Invalid sponsor tier', 400);
    }

    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
    });
    if (!competition) {
      return errorResponse('No active competition found', 400);
    }

    // Check if pageContent overrides the price
    let price = TIER_PRICES[tier];
    const pc = competition.pageContent as Record<string, string> | null;
    if (pc) {
      const priceKeyMap: Record<string, string> = {
        TITLE: 'titleSponsorPrice',
        PLATINUM: 'platinumSponsorPrice',
        GOLD: 'goldSponsorPrice',
        SILVER: 'silverSponsorPrice',
        STARTUP_PARTNER: 'startupPartnerPrice',
        INNOVATION_PARTNER: 'innovationPartnerPrice',
        COMMUNITY_PARTNER: 'communityPartnerPrice',
        STAGE: 'stageSponsorPrice',
        MEDIA: 'mediaSponsorPrice',
        AWARD: 'awardSponsorPrice',
      };
      const priceKey = priceKeyMap[tier];
      if (priceKey && pc[priceKey]) {
        const parsed = parsePriceFromString(pc[priceKey]);
        if (parsed) price = parsed;
      }
    }

    return successResponse({
      tier,
      label: TIER_LABELS[tier],
      price,
      competitionName: competition.name,
    });
  } catch (error) {
    console.error('Sponsor tier fetch error:', error);
    return errorResponse('Failed to fetch sponsor tier info', 500);
  }
}

// POST /api/competition/sponsor — Create sponsor registration + Razorpay order
export async function POST(request: NextRequest) {
  try {
    const { tier, companyName, contactPerson, designation, email, phone, website, gstNumber } = await request.json();

    if (!tier || !TIER_PRICES[tier]) {
      return errorResponse('Invalid sponsor tier', 400);
    }
    if (!companyName?.trim() || !contactPerson?.trim() || !designation?.trim() || !email?.trim() || !phone?.trim()) {
      return errorResponse('Company name, contact person, designation, email, and phone are required', 400);
    }

    // Validate email
    const emailClean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return errorResponse('Invalid email address', 400);
    }

    // Validate phone
    const phoneClean = phone.replace(/\s/g, '');
    if (!/^\+?\d{10,13}$/.test(phoneClean)) {
      return errorResponse('Invalid phone number', 400);
    }

    // Get active competition
    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
    });
    if (!competition) {
      return errorResponse('No active competition found', 400);
    }

    // Determine price (check pageContent overrides)
    let amount = TIER_PRICES[tier];
    const pc = competition.pageContent as Record<string, string> | null;
    if (pc) {
      const priceKeyMap: Record<string, string> = {
        TITLE: 'titleSponsorPrice',
        PLATINUM: 'platinumSponsorPrice',
        GOLD: 'goldSponsorPrice',
        SILVER: 'silverSponsorPrice',
        STARTUP_PARTNER: 'startupPartnerPrice',
        INNOVATION_PARTNER: 'innovationPartnerPrice',
        COMMUNITY_PARTNER: 'communityPartnerPrice',
        STAGE: 'stageSponsorPrice',
        MEDIA: 'mediaSponsorPrice',
        AWARD: 'awardSponsorPrice',
      };
      const priceKey = priceKeyMap[tier];
      if (priceKey && pc[priceKey]) {
        const parsed = parsePriceFromString(pc[priceKey]);
        if (parsed) amount = parsed;
      }
    }

    const sponsorId = await generateSponsorId(competition.id);

    // Create sponsor registration
    const registration = await prisma.sponsorRegistration.create({
      data: {
        sponsorId,
        tier,
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        designation: designation.trim(),
        email: emailClean,
        phone: phoneClean,
        website: website?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        amount,
        paymentStatus: 'PENDING',
        competitionId: competition.id,
      },
    });

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: registration.id,
      notes: {
        registration_id: registration.id,
        sponsor_id: sponsorId,
        tier,
        competition_id: competition.id,
        type: 'sponsor_registration',
      },
    });

    // Save order ID
    await prisma.sponsorRegistration.update({
      where: { id: registration.id },
      data: { razorpayOrderId: order.id },
    });

    return successResponse({
      registrationId: registration.id,
      sponsorId,
      orderId: order.id,
      amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      tierLabel: TIER_LABELS[tier],
      competitionName: competition.name,
      prefill: {
        name: contactPerson.trim(),
        email: emailClean,
        contact: phoneClean,
      },
    });
  } catch (error) {
    console.error('Sponsor registration creation error:', error);
    return errorResponse('Failed to create sponsor registration order', 500);
  }
}

// PUT /api/competition/sponsor — Verify payment
export async function PUT(request: NextRequest) {
  try {
    const { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!registrationId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Missing payment verification data', 400);
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return errorResponse('Invalid payment signature', 400);
    }

    const registration = await prisma.sponsorRegistration.findUnique({ where: { id: registrationId } });
    if (!registration) return errorResponse('Sponsor registration not found', 404);

    if (registration.paymentStatus === 'PAID') {
      return successResponse({ message: 'Payment already verified', registration });
    }

    const updatedRegistration = await prisma.sponsorRegistration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    return successResponse({ message: 'Payment verified', registration: updatedRegistration });
  } catch (error) {
    console.error('Sponsor payment verification error:', error);
    return errorResponse('Failed to verify payment', 500);
  }
}
