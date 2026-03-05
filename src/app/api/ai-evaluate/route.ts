import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

interface AIEvaluation {
  aiScore: number;
  marketPotential: string;
  executionRisk: string;
  startupPotential: number;
  summary: string;
}

async function evaluateStartup(startup: {
  title: string;
  shortDescription: string;
  problemDescription: string;
  targetAudience: string;
  solutionExplanation: string;
  innovationUniqueness: string;
  category: string;
  productStage: string;
}): Promise<AIEvaluation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

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

Evaluate this startup on the following criteria and respond ONLY with valid JSON (no markdown, no code blocks):

{
  "aiScore": <number 1-100, innovation score based on uniqueness, creativity, and potential impact>,
  "marketPotential": "<one of: Very High, High, Medium, Low, Very Low>",
  "executionRisk": "<one of: Very Low, Low, Medium, High, Very High>",
  "startupPotential": <number 1-100, overall startup viability score>,
  "summary": "<2-3 sentence evaluation summary>"
}

Be realistic but encouraging. Consider the problem-solution fit, market size, competition, and feasibility.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Parse JSON from response, stripping any markdown fences
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    aiScore: Math.min(100, Math.max(1, Math.round(parsed.aiScore))),
    marketPotential: parsed.marketPotential || 'Medium',
    executionRisk: parsed.executionRisk || 'Medium',
    startupPotential: Math.min(100, Math.max(1, Math.round(parsed.startupPotential))),
    summary: parsed.summary || '',
  };
}

// POST /api/ai-evaluate — Evaluate a startup with AI
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const { startupId } = await request.json();
    if (!startupId) return errorResponse('startupId is required', 400);

    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        problemDescription: true,
        targetAudience: true,
        solutionExplanation: true,
        innovationUniqueness: true,
        category: true,
        productStage: true,
        founderId: true,
        aiScore: true,
      },
    });

    if (!startup) return errorResponse('Startup not found', 404);

    // Only founder or admin can trigger evaluation
    if (startup.founderId !== decoded.userId && decoded.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403);
    }

    // Run AI evaluation
    const evaluation = await evaluateStartup(startup);

    // Update startup with AI scores
    const updated = await prisma.startup.update({
      where: { id: startupId },
      data: {
        aiScore: evaluation.aiScore,
        marketPotential: evaluation.marketPotential,
        executionRisk: evaluation.executionRisk,
        startupPotential: evaluation.startupPotential,
      },
      select: {
        aiScore: true,
        marketPotential: true,
        executionRisk: true,
        startupPotential: true,
      },
    });

    return successResponse({
      ...updated,
      summary: evaluation.summary,
    });
  } catch (error) {
    console.error('AI evaluation error:', error);
    const message = error instanceof Error ? error.message : 'AI evaluation failed';
    return errorResponse(message, 500);
  }
}
