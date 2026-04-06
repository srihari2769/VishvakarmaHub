import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// Practice question pool (larger pool for subscribers)
function generatePracticeQuestions(category: string, seed: number) {
  const pools: Record<string, Array<{ id: string; question: string; options: string[]; correctAnswer: string; points: number }>> = {
    logic: [
      { id: 'p1', question: 'If all startups need funding, and X is a startup, then X needs...?', options: ['Revenue', 'Funding', 'Employees', 'An office'], correctAnswer: 'Funding', points: 10 },
      { id: 'p2', question: 'Complete the pattern: 2, 6, 12, 20, ?', options: ['28', '30', '24', '32'], correctAnswer: '30', points: 10 },
      { id: 'p3', question: 'If a startup doubles users every month starting from 100, how many after 3 months?', options: ['400', '600', '800', '1000'], correctAnswer: '800', points: 10 },
      { id: 'p4', question: 'A company has 60% male and 40% female employees. If there are 200 employees, how many are female?', options: ['60', '80', '100', '120'], correctAnswer: '80', points: 10 },
      { id: 'p5', question: 'Which is the odd one out? VC, Angel, Bootstrapping, Revenue', options: ['VC', 'Angel', 'Bootstrapping', 'Revenue'], correctAnswer: 'Revenue', points: 10 },
      { id: 'p6', question: 'If CAC is ₹500 and LTV is ₹1500, what is the LTV:CAC ratio?', options: ['1:3', '3:1', '2:1', '1:1'], correctAnswer: '3:1', points: 10 },
      { id: 'p7', question: 'Complete: Idea → Validate → Build → ? → Scale', options: ['Fund', 'Launch', 'Pivot', 'Hire'], correctAnswer: 'Launch', points: 10 },
      { id: 'p8', question: 'A startup burns ₹2L/month with ₹12L in bank. What is the runway?', options: ['4 months', '6 months', '8 months', '12 months'], correctAnswer: '6 months', points: 10 },
    ],
    business: [
      { id: 'p9', question: 'What is the primary purpose of a pitch deck?', options: ['Legal compliance', 'Attract investors', 'Employee onboarding', 'Tax filing'], correctAnswer: 'Attract investors', points: 10 },
      { id: 'p10', question: 'Which model charges users a recurring fee?', options: ['One-time purchase', 'Subscription', 'Freemium', 'Pay-per-use'], correctAnswer: 'Subscription', points: 10 },
      { id: 'p11', question: 'What does "runway" mean for a startup?', options: ['Office space', 'Time before money runs out', 'Product roadmap', 'Hiring plan'], correctAnswer: 'Time before money runs out', points: 10 },
      { id: 'p12', question: 'What is a moat in business?', options: ['A water feature', 'Competitive advantage', 'Marketing budget', 'Legal protection'], correctAnswer: 'Competitive advantage', points: 10 },
      { id: 'p13', question: 'Which metric best indicates product-market fit?', options: ['Revenue', 'User retention', 'Funding raised', 'Team size'], correctAnswer: 'User retention', points: 10 },
      { id: 'p14', question: 'What is a loss leader strategy?', options: ['Selling below cost to attract customers', 'Firing employees', 'Reducing quality', 'Closing stores'], correctAnswer: 'Selling below cost to attract customers', points: 10 },
      { id: 'p15', question: 'What is an exit strategy?', options: ['Emergency plan', 'Plan for founders to realize returns', 'Office evacuation', 'Shutdown procedure'], correctAnswer: 'Plan for founders to realize returns', points: 10 },
      { id: 'p16', question: 'What does NPS measure?', options: ['Net Profit Score', 'Net Promoter Score', 'New Product Sales', 'National Product Standard'], correctAnswer: 'Net Promoter Score', points: 10 },
    ],
    creative: [
      { id: 'p17', question: 'Which design thinking phase involves testing with users?', options: ['Empathize', 'Define', 'Ideate', 'Test'], correctAnswer: 'Test', points: 10 },
      { id: 'p18', question: 'What is "thinking outside the box" most related to?', options: ['Logical reasoning', 'Creative problem solving', 'Data analysis', 'Risk management'], correctAnswer: 'Creative problem solving', points: 10 },
      { id: 'p19', question: 'Which brainstorming rule is most important?', options: ['Critique all ideas', 'Quantity over quality first', 'Only practical ideas', 'One person talks'], correctAnswer: 'Quantity over quality first', points: 10 },
      { id: 'p20', question: 'What is a minimum lovable product?', options: ['Cheapest product', 'MVP that users love', 'Most expensive version', 'Beta test'], correctAnswer: 'MVP that users love', points: 10 },
      { id: 'p21', question: 'What is growth hacking?', options: ['Illegal marketing', 'Creative low-cost growth strategies', 'Hacking competitors', 'Rapid hiring'], correctAnswer: 'Creative low-cost growth strategies', points: 10 },
      { id: 'p22', question: 'What is the Jobs-to-be-Done framework?', options: ['Hiring framework', 'Understanding why customers buy', 'Task management', 'Job board design'], correctAnswer: 'Understanding why customers buy', points: 10 },
      { id: 'p23', question: 'What does "fail fast" mean in startups?', options: ['Give up quickly', 'Test ideas quickly, learn from failures', 'Ship buggy products', 'Fire employees fast'], correctAnswer: 'Test ideas quickly, learn from failures', points: 10 },
      { id: 'p24', question: 'What is a value proposition canvas?', options: ['Financial model', 'Tool to match product to customer needs', 'Art canvas', 'Marketing plan'], correctAnswer: 'Tool to match product to customer needs', points: 10 },
    ],
  };

  const pool = pools[category] || pools.logic;
  const shuffled = [...pool].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(1)) & 0x7fffffff) % 1000;
    const hb = ((seed * 31 + b.id.charCodeAt(1)) & 0x7fffffff) % 1000;
    return ha - hb;
  });
  return shuffled.slice(0, 5);
}

// GET — get practice questions
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    // Check subscription
    const subscription = await prisma.vSCSubscription.findFirst({
      where: {
        userId: decoded.userId,
        challengeId: challenge.id,
        isActive: true,
        paymentStatus: 'PAID',
        expiresAt: { gte: new Date() },
        plan: { in: ['PRACTICE_WEEKLY', 'PRACTICE_MONTHLY', 'VIP_MONTHLY'] },
      },
    });

    if (!subscription) {
      return successResponse({
        hasAccess: false,
        plans: [
          { plan: 'PRACTICE_WEEKLY', price: challenge.practiceWeeklyPrice, label: 'Weekly', duration: '7 days' },
          { plan: 'PRACTICE_MONTHLY', price: challenge.practiceMonthlyPrice, label: 'Monthly', duration: '30 days' },
          { plan: 'VIP_MONTHLY', price: challenge.vipMonthlyPrice, label: 'VIP Monthly', duration: '30 days', features: ['Unlimited practice', 'Priority review', 'VIP badge', 'Performance reports'] },
        ],
      });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'logic';
    const seed = Date.now();
    const questions = generatePracticeQuestions(category, seed);

    return successResponse({
      hasAccess: true,
      subscription: { plan: subscription.plan, expiresAt: subscription.expiresAt },
      questions: questions.map(q => ({ ...q, correctAnswer: undefined })),
      categories: ['logic', 'business', 'creative'],
      sessionId: seed,
    });
  } catch (error) {
    console.error('Practice GET error:', error);
    return errorResponse('Failed to fetch practice', 500);
  }
}

// POST — submit practice answers (no stakes, just feedback)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const body = await request.json();
    const { answers, category, sessionId } = body;
    if (!answers) return errorResponse('Answers required', 400);

    const questions = generatePracticeQuestions(category || 'logic', sessionId || Date.now());

    let score = 0;
    const graded = answers.map((a: { questionId: string; answer: string }) => {
      const q = questions.find(q => q.id === a.questionId);
      const isCorrect = q && q.correctAnswer === a.answer;
      if (isCorrect) score += (q?.points || 10);
      return { ...a, isCorrect, points: isCorrect ? (q?.points || 10) : 0, correctAnswer: q?.correctAnswer };
    });

    return successResponse({ score, maxScore: 50, graded, category });
  } catch (error) {
    console.error('Practice POST error:', error);
    return errorResponse('Failed to submit', 500);
  }
}
