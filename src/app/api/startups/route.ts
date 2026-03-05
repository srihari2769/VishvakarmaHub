import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest, slugify } from '@/lib/utils';

// Allow up to 30s for cold starts + distant DB
export const maxDuration = 30;

async function triggerAIEvaluation(startupId: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    select: {
      title: true,
      shortDescription: true,
      problemDescription: true,
      targetAudience: true,
      solutionExplanation: true,
      innovationUniqueness: true,
      category: true,
      productStage: true,
    },
  });

  if (!startup) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert startup evaluator. Analyze the following startup idea and provide a structured evaluation.

Startup Details:
- Title: ${startup.title}
- Category: ${startup.category}
- Product Stage: ${startup.productStage}
- Short Description: ${startup.shortDescription}
- Problem: ${startup.problemDescription}
- Target Audience: ${startup.targetAudience}
- Solution: ${startup.solutionExplanation}
- What Makes It Unique: ${startup.innovationUniqueness}

Evaluate this startup and respond ONLY with valid JSON (no markdown, no code blocks):

{
  "aiScore": <number 1-100, innovation score>,
  "marketPotential": "<one of: Very High, High, Medium, Low, Very Low>",
  "executionRisk": "<one of: Very Low, Low, Medium, High, Very High>",
  "startupPotential": <number 1-100, overall viability score>
}

Be realistic but encouraging.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);

  await prisma.startup.update({
    where: { id: startupId },
    data: {
      aiScore: Math.min(100, Math.max(1, Math.round(parsed.aiScore))),
      marketPotential: parsed.marketPotential || 'Medium',
      executionRisk: parsed.executionRisk || 'Medium',
      startupPotential: Math.min(100, Math.max(1, Math.round(parsed.startupPotential))),
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const founderMode = searchParams.get('founder');

    const where: Record<string, unknown> = {};

    // If founder=me, fetch only the current user's startups (any status)
    if (founderMode === 'me') {
      const token = getTokenFromRequest(request);
      if (!token) return errorResponse('Unauthorized', 401);
      const payload = verifyToken(token);
      where.founderId = payload.userId;
    } else {
      where.status = status || 'APPROVED';
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case 'popular':
        orderBy.campaign = 'desc';
        break;
      case 'funded':
        orderBy.campaign = 'desc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const [startups, total] = await Promise.all([
      prisma.startup.findMany({
        where: where as any,
        include: {
          founder: {
            select: { firstName: true, lastName: true, avatar: true },
          },
          campaign: {
            select: {
              fundingGoal: true,
              raisedAmount: true,
              supporterCount: true,
              endDate: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.startup.count({ where: where as any }),
    ]);

    return successResponse({
      startups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get startups error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    const body = await request.json();
    const {
      title,
      shortDescription,
      problemDescription,
      targetAudience,
      solutionExplanation,
      innovationUniqueness,
      category,
      location,
      productStage,
      fundingGoal,
      campaignDuration,
      rewardTiers,
      logo,
      pitchDeck,
      screenshots,
      demoVideo,
      endDate,
    } = body;

    // Validate required fields
    if (!title || !shortDescription || !problemDescription || !targetAudience || !solutionExplanation || !innovationUniqueness || !category || !location) {
      return errorResponse('All required fields must be filled', 400);
    }

    const baseSlug = slugify(title);
    // Ensure slug uniqueness
    const existing = await prisma.startup.findUnique({ where: { slug: baseSlug } });
    const slug = existing ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}` : baseSlug;

    // Create startup with campaign
    const startup = await prisma.startup.create({
      data: {
        title,
        slug,
        shortDescription,
        problemDescription,
        targetAudience,
        solutionExplanation,
        innovationUniqueness,
        category,
        location,
        productStage: productStage || 'IDEA',
        status: 'PENDING',
        logo: logo || null,
        pitchDeck: pitchDeck || null,
        demoVideo: demoVideo || null,
        screenshots: screenshots || [],
        founderId: payload.userId,
        campaign: fundingGoal
          ? {
              create: {
                fundingGoal: parseFloat(fundingGoal),
                endDate: endDate ? new Date(endDate) : new Date(Date.now() + (parseInt(campaignDuration || '30') * 24 * 60 * 60 * 1000)),
                status: 'DRAFT',
                rewardTiers: rewardTiers?.length
                  ? {
                      create: rewardTiers.map((tier: { name: string; amount: number; description: string; maxClaims?: number }) => ({
                        name: tier.name,
                        amount: tier.amount,
                        description: tier.description,
                        maxClaims: tier.maxClaims,
                      })),
                    }
                  : undefined,
              },
            }
          : undefined,
        milestones: {
          create: [
            { title: 'Idea Validation', description: 'Validate the idea with target audience', status: 'PENDING' },
            { title: 'MVP Development', description: 'Build the minimum viable product', status: 'PENDING' },
            { title: 'Beta Launch', description: 'Launch beta version to early adopters', status: 'PENDING' },
            { title: 'Public Launch', description: 'Full public launch', status: 'PENDING' },
          ],
        },
      },
      include: {
        founder: { select: { firstName: true, lastName: true } },
        campaign: true,
      },
    });

    // Update user role to FOUNDER if not already
    if (payload.role === 'USER') {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { role: 'FOUNDER' },
      });
    }

    // Trigger AI evaluation (await so it completes within function lifetime)
    if (process.env.GEMINI_API_KEY) {
      try {
        await triggerAIEvaluation(startup.id);
      } catch (err) {
        console.error('AI evaluation failed:', err);
      }
    }

    return successResponse(startup, 201);
  } catch (error) {
    console.error('Create startup error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
}
