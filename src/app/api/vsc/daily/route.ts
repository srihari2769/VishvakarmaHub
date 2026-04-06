import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;

// Daily question pool — 5 quick questions per day
function generateDailyQuestions(dateStr: string) {
  const allQuestions = [
    { id: 'd1', question: 'What does MVP stand for in startup terminology?', options: ['Most Valuable Player', 'Minimum Viable Product', 'Maximum Value Proposition', 'Market Validation Process'], correctAnswer: 'Minimum Viable Product', points: 10 },
    { id: 'd2', question: 'Which metric measures the cost to acquire a customer?', options: ['LTV', 'CAC', 'MRR', 'ARR'], correctAnswer: 'CAC', points: 10 },
    { id: 'd3', question: 'What is a pivot in startup context?', options: ['Shutting down', 'Changing direction/strategy', 'Getting funded', 'Going public'], correctAnswer: 'Changing direction/strategy', points: 10 },
    { id: 'd4', question: 'What does SaaS stand for?', options: ['Software as a Service', 'System as a Solution', 'Sales as a Strategy', 'Startup as a Service'], correctAnswer: 'Software as a Service', points: 10 },
    { id: 'd5', question: 'Which funding stage comes first?', options: ['Series A', 'Seed', 'Pre-seed', 'Series B'], correctAnswer: 'Pre-seed', points: 10 },
    { id: 'd6', question: 'What is burn rate?', options: ['Speed of hiring', 'Rate of spending cash', 'Revenue growth rate', 'Customer churn rate'], correctAnswer: 'Rate of spending cash', points: 10 },
    { id: 'd7', question: 'What is a unicorn startup?', options: ['A rare idea', 'Valued at $1B+', 'First-time founder', 'Non-profit startup'], correctAnswer: 'Valued at $1B+', points: 10 },
    { id: 'd8', question: 'What does B2B mean?', options: ['Business to Business', 'Back to Basics', 'Brand to Buyer', 'Build to Budget'], correctAnswer: 'Business to Business', points: 10 },
    { id: 'd9', question: 'What is equity in a startup?', options: ['Debt owed', 'Ownership stake', 'Revenue share', 'Profit margin'], correctAnswer: 'Ownership stake', points: 10 },
    { id: 'd10', question: 'What is a term sheet?', options: ['Business plan', 'Investment terms document', 'Product roadmap', 'Marketing brief'], correctAnswer: 'Investment terms document', points: 10 },
    { id: 'd11', question: 'What does ROI stand for?', options: ['Return on Investment', 'Rate of Interest', 'Revenue on Income', 'Risk of Innovation'], correctAnswer: 'Return on Investment', points: 10 },
    { id: 'd12', question: 'What is bootstrapping?', options: ['Getting VC funding', 'Self-funding your startup', 'Copying competitors', 'Rapid scaling'], correctAnswer: 'Self-funding your startup', points: 10 },
    { id: 'd13', question: 'What is a pitch deck?', options: ['A slide presentation for investors', 'A product manual', 'A marketing flyer', 'A legal document'], correctAnswer: 'A slide presentation for investors', points: 10 },
    { id: 'd14', question: 'What is TAM?', options: ['Total Addressable Market', 'Target Audience Mapping', 'Total Annual Marketing', 'Technology Assessment Model'], correctAnswer: 'Total Addressable Market', points: 10 },
    { id: 'd15', question: 'What is churn rate?', options: ['New customer rate', 'Customer loss rate', 'Revenue growth', 'Profit margin'], correctAnswer: 'Customer loss rate', points: 10 },
    { id: 'd16', question: 'What does PMF stand for?', options: ['Product Market Fit', 'Profit Margin Factor', 'Purchase Management Fee', 'Planning Milestone Framework'], correctAnswer: 'Product Market Fit', points: 10 },
    { id: 'd17', question: 'What is an angel investor?', options: ['A bank lender', 'An early-stage individual investor', 'A government grant provider', 'A crowdfunding platform'], correctAnswer: 'An early-stage individual investor', points: 10 },
    { id: 'd18', question: 'What is a cap table?', options: ['Market cap chart', 'Ownership breakdown of a company', 'Sales forecast', 'Expense report'], correctAnswer: 'Ownership breakdown of a company', points: 10 },
    { id: 'd19', question: 'What is runway?', options: ['Product launch path', 'Time before cash runs out', 'Marketing channel', 'Hiring pipeline'], correctAnswer: 'Time before cash runs out', points: 10 },
    { id: 'd20', question: 'What is due diligence?', options: ['Legal compliance', 'Investigation before investment', 'Product testing', 'Market research'], correctAnswer: 'Investigation before investment', points: 10 },
    { id: 'd21', question: 'What is a convertible note?', options: ['A type of loan that converts to equity', 'A bank loan', 'A grant', 'Revenue-based financing'], correctAnswer: 'A type of loan that converts to equity', points: 10 },
    { id: 'd22', question: 'What is lean startup methodology?', options: ['Cutting costs', 'Build-Measure-Learn cycle', 'Hiring fewer people', 'Minimal marketing'], correctAnswer: 'Build-Measure-Learn cycle', points: 10 },
    { id: 'd23', question: 'What is an accelerator?', options: ['A fast computer', 'A program that helps startups grow', 'A marketing tool', 'A payment processor'], correctAnswer: 'A program that helps startups grow', points: 10 },
    { id: 'd24', question: 'What is freemium model?', options: ['Everything is free', 'Free basic + paid premium features', 'Free trial only', 'Ad-supported only'], correctAnswer: 'Free basic + paid premium features', points: 10 },
    { id: 'd25', question: 'What is MRR?', options: ['Monthly Recurring Revenue', 'Maximum Return Rate', 'Market Research Report', 'Minimum Required Revenue'], correctAnswer: 'Monthly Recurring Revenue', points: 10 },
    { id: 'd26', question: 'What is a vesting schedule?', options: ['Payment calendar', 'Gradual ownership over time', 'Meeting schedule', 'Delivery timeline'], correctAnswer: 'Gradual ownership over time', points: 10 },
    { id: 'd27', question: 'If your startup has 1000 users and 50 leave per month, what is the monthly churn rate?', options: ['5%', '50%', '0.5%', '10%'], correctAnswer: '5%', points: 10 },
    { id: 'd28', question: 'What is a go-to-market strategy?', options: ['Moving offices', 'Plan for launching product to customers', 'Entering stock market', 'Export strategy'], correctAnswer: 'Plan for launching product to customers', points: 10 },
    { id: 'd29', question: 'What is product-led growth?', options: ['Marketing-first approach', 'Product itself drives acquisition', 'Sales-driven growth', 'Investor-funded growth'], correctAnswer: 'Product itself drives acquisition', points: 10 },
    { id: 'd30', question: 'What is a Series A round?', options: ['First public offering', 'First significant VC funding round', 'Angel investment', 'Crowdfunding campaign'], correctAnswer: 'First significant VC funding round', points: 10 },
  ];

  // Use date string as seed to get consistent 5 questions per day
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const shuffled = [...allQuestions].sort((a, b) => {
    const ha = ((hash * 31 + a.id.charCodeAt(1)) & 0x7fffffff) % 1000;
    const hb = ((hash * 31 + b.id.charCodeAt(1)) & 0x7fffffff) % 1000;
    return ha - hb;
  });
  return shuffled.slice(0, 5);
}

// GET — get today's daily challenge + streak info
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    const today = new Date().toISOString().split('T')[0];

    // Get or create streak
    let streak = await prisma.vSCDailyStreak.findUnique({
      where: { userId_challengeId: { userId: decoded.userId, challengeId: challenge.id } },
      include: { attempts: { orderBy: { date: 'desc' }, take: 7 } },
    });

    if (!streak) {
      streak = await prisma.vSCDailyStreak.create({
        data: { userId: decoded.userId, challengeId: challenge.id },
        include: { attempts: { orderBy: { date: 'desc' }, take: 7 } },
      });
    }

    // Check if streak is broken (missed yesterday)
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (streak.lastPlayedAt) {
      const lastDate = streak.lastPlayedAt.toISOString().split('T')[0];
      if (lastDate !== today && lastDate !== yesterday && streak.currentStreak > 0) {
        // Streak broken
        await prisma.vSCDailyStreak.update({
          where: { id: streak.id },
          data: { currentStreak: 0 },
        });
        streak.currentStreak = 0;
      }
    }

    const todayAttempt = streak.attempts.find(a => a.date === today);
    const questions = generateDailyQuestions(today);

    // Streak milestones and rewards
    const milestones = [
      { days: 3, reward: '🎯 +5 bonus points' },
      { days: 7, reward: '⏱️ Free Extra Time power-up' },
      { days: 14, reward: '🔥 Free Leaderboard Boost' },
      { days: 30, reward: '💎 Free Revive power-up' },
    ];
    const nextMilestone = milestones.find(m => m.days > streak.currentStreak);

    return successResponse({
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalPoints: streak.totalPoints,
        freeRewardsEarned: streak.freeRewardsEarned,
        lastPlayedAt: streak.lastPlayedAt,
      },
      today: {
        date: today,
        completed: !!todayAttempt,
        score: todayAttempt?.score || 0,
        maxScore: todayAttempt?.maxScore || 50,
      },
      questions: todayAttempt
        ? questions.map(q => ({ ...q, correctAnswer: undefined })) // hide answers if already done (show review)
        : questions.map(q => ({ ...q, correctAnswer: undefined })),
      recentAttempts: streak.attempts.slice(0, 7),
      nextMilestone,
      challengeId: challenge.id,
    });
  } catch (error) {
    console.error('Daily streak GET error:', error);
    return errorResponse('Failed to fetch daily challenge', 500);
  }
}

// POST — submit daily answers
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);
    const decoded = verifyToken(token);
    if (!decoded) return errorResponse('Invalid token', 401);

    const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
    if (!challenge) return errorResponse('No active challenge', 404);

    const today = new Date().toISOString().split('T')[0];

    let streak = await prisma.vSCDailyStreak.findUnique({
      where: { userId_challengeId: { userId: decoded.userId, challengeId: challenge.id } },
    });
    if (!streak) {
      streak = await prisma.vSCDailyStreak.create({
        data: { userId: decoded.userId, challengeId: challenge.id },
      });
    }

    // Check already done today
    const existing = await prisma.vSCDailyAttempt.findUnique({
      where: { streakId_date: { streakId: streak.id, date: today } },
    });
    if (existing) return errorResponse('Already completed today\'s challenge', 400);

    const body = await request.json();
    const { answers } = body;
    if (!answers || !Array.isArray(answers)) return errorResponse('Answers required', 400);

    const questions = generateDailyQuestions(today);

    // Grade
    let score = 0;
    const graded = answers.map((a: { questionId: string; answer: string }) => {
      const q = questions.find(q => q.id === a.questionId);
      const isCorrect = q && q.correctAnswer === a.answer;
      if (isCorrect) score += (q?.points || 10);
      return { ...a, isCorrect, points: isCorrect ? (q?.points || 10) : 0 };
    });

    // Update streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastDate = streak.lastPlayedAt?.toISOString().split('T')[0];
    const isConsecutive = lastDate === yesterday || !lastDate;
    const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;

    // Check milestone rewards
    let rewardMessage = '';
    const milestoneRewards: Record<number, string> = { 3: 'bonus_points', 7: 'EXTRA_TIME', 14: 'LEADERBOARD_BOOST', 30: 'REVIVE' };
    const milestoneReward = milestoneRewards[newStreak];

    if (milestoneReward && milestoneReward !== 'bonus_points') {
      // Grant free power-up to the user's latest paid participant
      const participant = await prisma.vSCParticipant.findFirst({
        where: { userId: decoded.userId, challengeId: challenge.id, paymentStatus: 'PAID' },
        orderBy: { attemptNumber: 'desc' },
      });
      if (participant) {
        const priceMap: Record<string, number> = { EXTRA_TIME: challenge.extraTimePrice, LEADERBOARD_BOOST: challenge.leaderboardBoostPrice, REVIVE: challenge.revivePrice };
        await prisma.vSCPowerUp.create({
          data: {
            userId: decoded.userId,
            participantId: participant.id,
            type: milestoneReward,
            price: 0,
            paymentStatus: 'FREE_REWARD',
            isUsed: false,
          },
        });
        rewardMessage = `🎁 ${newStreak}-day streak! You earned a free ${milestoneReward.replace(/_/g, ' ')} power-up!`;
      }
    } else if (newStreak === 3) {
      score += 5; // bonus points
      rewardMessage = '🎯 3-day streak! +5 bonus points!';
    }

    await prisma.vSCDailyAttempt.create({
      data: {
        streakId: streak.id,
        date: today,
        score,
        maxScore: 50,
        questions: JSON.parse(JSON.stringify(questions)),
        answers: JSON.parse(JSON.stringify(graded)),
      },
    });

    await prisma.vSCDailyStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastPlayedAt: new Date(),
        totalPoints: { increment: score },
        ...(milestoneReward ? { freeRewardsEarned: { increment: 1 } } : {}),
      },
    });

    return successResponse({
      score,
      maxScore: 50,
      graded,
      streak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      rewardMessage,
    });
  } catch (error) {
    console.error('Daily streak POST error:', error);
    return errorResponse('Failed to submit', 500);
  }
}
