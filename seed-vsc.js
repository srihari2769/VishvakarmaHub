const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:VishvakarmaHub2026@vishvakarmahub.cno2sysqypnb.ap-southeast-2.rds.amazonaws.com:5432/postgres?sslmode=require',
    max: 2,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Check if challenge already exists
  let challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
  const roundCount = challenge ? await prisma.vSCRound.count({ where: { challengeId: challenge.id } }) : 0;

  if (challenge && roundCount >= 7) {
    console.log('✅ VSC Challenge already fully seeded:', challenge.id, challenge.name);
    console.log(`   Rounds: ${roundCount}`);
    console.log(`   Participants: ${await prisma.vSCParticipant.count({ where: { challengeId: challenge.id } })}`);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  if (challenge) {
    console.log('📦 Challenge exists but has', roundCount, 'rounds. Adding missing rounds...');
    // Delete existing rounds to re-seed cleanly
    if (roundCount > 0) {
      await prisma.vSCRound.deleteMany({ where: { challengeId: challenge.id } });
      console.log('   Cleared existing rounds');
    }
  } else {
    console.log('🔥 Creating VSC Challenge...');
    challenge = await prisma.vSCChallenge.create({
      data: {
        name: 'Vishvakarma Survival Challenge',
        tagline: 'Survive 7 Rounds. Prove Your Worth.',
        description: 'The ultimate elimination challenge for innovators, entrepreneurs, and sharp minds. Battle through 7 intense rounds — from rapid-fire IQ tests to creative problem-solving, execution simulations, and a final video pitch. Only the strongest survive.',
        isActive: true,
        entryFee: 99,
        secondChanceFee: 49,
        thirdChanceFee: 19,
        skipRoundPrice: 199,
        extraTimePrice: 29,
        revivePrice: 59,
        leaderboardBoostPrice: 39,
        manualRegistrations: 0,
      },
    });
  }

  console.log('✅ Challenge created:', challenge.id);

  // Round 1: Speed IQ
  const round1 = await prisma.vSCRound.create({
    data: {
      challengeId: challenge.id,
      roundNumber: 1,
      title: 'Speed IQ Blitz',
      description: 'Test your raw intelligence under extreme time pressure. 20 rapid-fire questions covering logic, math, patterns, and general knowledge. You have 10 minutes.',
      roundType: 'SPEED_IQ',
      timeLimit: 600,
      passingPercent: 60,
      isActive: true,
      isLocked: false,
      questionPool: [
        { id: 'q1_01', question: 'What is the next number in the sequence: 2, 6, 12, 20, 30, ?', options: ['40', '42', '36', '38'], correctAnswer: '42', points: 10, category: 'Patterns' },
        { id: 'q1_02', question: 'If a startup grows 15% month-over-month, approximately how many months to double revenue?', options: ['3 months', '5 months', '7 months', '10 months'], correctAnswer: '5 months', points: 10, category: 'Business Math' },
        { id: 'q1_03', question: 'Which logical fallacy assumes something is true because it hasn\'t been proven false?', options: ['Ad hominem', 'Straw man', 'Appeal to ignorance', 'False dilemma'], correctAnswer: 'Appeal to ignorance', points: 10, category: 'Logic' },
        { id: 'q1_04', question: 'A product has a 40% margin and sells for ₹700. What is the cost price?', options: ['₹280', '₹420', '₹490', '₹350'], correctAnswer: '₹420', points: 10, category: 'Business Math' },
        { id: 'q1_05', question: 'Complete the analogy: Innovation is to Stagnation as Growth is to ?', options: ['Expansion', 'Decline', 'Stability', 'Progress'], correctAnswer: 'Decline', points: 10, category: 'Logic' },
        { id: 'q1_06', question: 'If 5 developers can build an MVP in 10 days, how many developers needed for 5 days?', options: ['10', '15', '8', '25'], correctAnswer: '10', points: 10, category: 'Business Math' },
        { id: 'q1_07', question: 'What does "PMF" stand for in startup terminology?', options: ['Product Market Fit', 'Projected Market Forecast', 'Pre-Market Funding', 'Primary Market Focus'], correctAnswer: 'Product Market Fit', points: 10, category: 'Startup Knowledge' },
        { id: 'q1_08', question: 'Which number doesn\'t belong: 3, 5, 11, 14, 17, 23?', options: ['5', '14', '11', '23'], correctAnswer: '14', points: 10, category: 'Patterns' },
        { id: 'q1_09', question: 'A company\'s burn rate is ₹5L/month with ₹30L in the bank. What is the runway?', options: ['3 months', '6 months', '12 months', '5 months'], correctAnswer: '6 months', points: 10, category: 'Business Math' },
        { id: 'q1_10', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 'O(log n)', points: 10, category: 'Tech' },
        { id: 'q1_11', question: 'If you flip a fair coin 3 times, what is the probability of getting at least 2 heads?', options: ['1/2', '3/8', '1/4', '5/8'], correctAnswer: '1/2', points: 10, category: 'Math' },
        { id: 'q1_12', question: 'Which Indian startup became the fastest to reach unicorn status?', options: ['Flipkart', 'Zepto', 'Meesho', 'CRED'], correctAnswer: 'Zepto', points: 10, category: 'Startup Knowledge' },
        { id: 'q1_13', question: 'What comes next: 1, 1, 2, 3, 5, 8, 13, ?', options: ['18', '20', '21', '16'], correctAnswer: '21', points: 10, category: 'Patterns' },
        { id: 'q1_14', question: 'CAC stands for:', options: ['Customer Acquisition Cost', 'Customer Average Conversion', 'Company Annual Capital', 'Cumulative Acquisition Channel'], correctAnswer: 'Customer Acquisition Cost', points: 10, category: 'Business' },
        { id: 'q1_15', question: 'A train travels 60 km in 40 minutes. What is its speed in km/hr?', options: ['80', '90', '100', '75'], correctAnswer: '90', points: 10, category: 'Math' },
        { id: 'q1_16', question: 'Which design principle states "less is more"?', options: ['Brutalism', 'Minimalism', 'Maximalism', 'Skeuomorphism'], correctAnswer: 'Minimalism', points: 10, category: 'Design' },
        { id: 'q1_17', question: 'If LTV/CAC ratio is 1:1, your business is:', options: ['Highly profitable', 'Breaking even on acquisition', 'Losing money', 'Growing fast'], correctAnswer: 'Breaking even on acquisition', points: 10, category: 'Business' },
        { id: 'q1_18', question: 'What percentage of Indian startups fail within the first 5 years?', options: ['50%', '70%', '90%', '30%'], correctAnswer: '90%', points: 10, category: 'Startup Knowledge' },
        { id: 'q1_19', question: 'In a room of 23 people, what is the approximate probability that two share a birthday?', options: ['10%', '25%', '50%', '75%'], correctAnswer: '50%', points: 10, category: 'Math' },
        { id: 'q1_20', question: 'Which framework is known for "Move fast and break things"?', options: ['Agile', 'Lean Startup', 'Facebook culture', 'Design Thinking'], correctAnswer: 'Facebook culture', points: 10, category: 'Tech' },
        { id: 'q1_21', question: 'What does MVP stand for?', options: ['Minimum Viable Product', 'Most Valuable Player', 'Maximum Value Proposition', 'Market Validation Process'], correctAnswer: 'Minimum Viable Product', points: 10, category: 'Startup Knowledge' },
        { id: 'q1_22', question: 'If a number is divisible by 6, it must be divisible by:', options: ['4 and 3', '2 and 3', '2 and 5', '3 and 5'], correctAnswer: '2 and 3', points: 10, category: 'Math' },
        { id: 'q1_23', question: 'Which country has the 3rd largest startup ecosystem after USA and China?', options: ['UK', 'India', 'Israel', 'Germany'], correctAnswer: 'India', points: 10, category: 'Startup Knowledge' },
        { id: 'q1_24', question: 'What is 15% of 2400?', options: ['340', '350', '360', '380'], correctAnswer: '360', points: 10, category: 'Math' },
        { id: 'q1_25', question: 'The "Lean Canvas" was created by:', options: ['Eric Ries', 'Ash Maurya', 'Steve Blank', 'Peter Thiel'], correctAnswer: 'Ash Maurya', points: 10, category: 'Startup Knowledge' },
      ],
    },
  });
  console.log(`   R1: ${round1.title} (${25} questions)`);

  // Round 2: Decision Making
  const round2 = await prisma.vSCRound.create({
    data: {
      challengeId: challenge.id,
      roundNumber: 2,
      title: 'Decision Maker',
      description: 'Face real-world business dilemmas and make tough calls. Each scenario tests your strategic thinking, risk assessment, and entrepreneurial judgment.',
      roundType: 'DECISION_MAKING',
      timeLimit: 900,
      passingPercent: 55,
      isActive: false,
      isLocked: true,
      questionPool: [
        { id: 'q2_01', question: 'Your startup has ₹10L runway and two options: hire 2 engineers (₹4L/mo) or run ads (₹2L/mo). Revenue is ₹1L/mo. What do you do?', options: ['Hire engineers to build faster', 'Run ads to grow revenue first', 'Do both with reduced spend', 'Seek additional funding immediately'], correctAnswer: 'Run ads to grow revenue first', points: 15, category: 'Strategy' },
        { id: 'q2_02', question: 'A competitor just launched a similar feature. Your team wants to pivot. You:', options: ['Pivot immediately', 'Double down on your unique value', 'Copy their feature and add more', 'Conduct user research first'], correctAnswer: 'Conduct user research first', points: 15, category: 'Strategy' },
        { id: 'q2_03', question: 'Your co-founder wants to take the product in a different direction. You disagree. Best approach?', options: ['Assert your vision as CEO', 'Let them try their approach', 'Bring in an advisor to mediate', 'Run A/B tests on both approaches'], correctAnswer: 'Run A/B tests on both approaches', points: 15, category: 'Leadership' },
        { id: 'q2_04', question: 'An investor offers ₹1Cr for 40% equity at seed stage. Your company is pre-revenue. You:', options: ['Accept immediately', 'Counter with 20% equity', 'Decline and bootstrap', 'Ask for convertible note instead'], correctAnswer: 'Ask for convertible note instead', points: 15, category: 'Fundraising' },
        { id: 'q2_05', question: 'Your app has 1000 DAU but monetization is failing. Next step?', options: ['Add more features', 'Pivot to B2B', 'Survey users about willingness to pay', 'Shut down and start over'], correctAnswer: 'Survey users about willingness to pay', points: 15, category: 'Product' },
        { id: 'q2_06', question: 'A major client wants custom features that deviate from your product roadmap. They represent 30% revenue. You:', options: ['Build everything they want', 'Refuse to maintain product integrity', 'Build as a separate module', 'Negotiate to align with roadmap where possible'], correctAnswer: 'Negotiate to align with roadmap where possible', points: 15, category: 'Product' },
        { id: 'q2_07', question: 'Your marketing campaign went viral but attracted wrong users. CAC dropped but retention is 5%. You:', options: ['Scale the campaign more', 'Stop campaign and refocus targeting', 'Adjust product for new user base', 'Run parallel targeted campaign'], correctAnswer: 'Stop campaign and refocus targeting', points: 15, category: 'Growth' },
        { id: 'q2_08', question: 'Two team members have a serious conflict affecting productivity. As founder, you:', options: ['Fire the less productive one', 'Ignore it and hope it resolves', 'Have 1-on-1s then mediate', 'Restructure teams to separate them'], correctAnswer: 'Have 1-on-1s then mediate', points: 15, category: 'Leadership' },
        { id: 'q2_09', question: 'Your product is ready but the market seems too early. You:', options: ['Launch anyway to learn', 'Wait 6 months', 'Find a different market', 'Launch to early adopters only'], correctAnswer: 'Launch to early adopters only', points: 15, category: 'Strategy' },
        { id: 'q2_10', question: 'You discover a security vulnerability in production. Fix requires 2 days downtime. You:', options: ['Patch it gradually with no downtime', 'Take the system down immediately', 'Wait until off-peak hours', 'Notify users and schedule maintenance window'], correctAnswer: 'Notify users and schedule maintenance window', points: 15, category: 'Operations' },
        { id: 'q2_11', question: 'Your best performer asks for a 50% raise or they leave. You can\'t afford it. You:', options: ['Let them go', 'Give equity instead', 'Match the demand somehow', 'Counter with 20% raise plus equity'], correctAnswer: 'Counter with 20% raise plus equity', points: 15, category: 'Leadership' },
        { id: 'q2_12', question: 'Government regulations are about to change, potentially killing your business model. You:', options: ['Lobby against the regulation', 'Pivot before regulations hit', 'Wait and see', 'Diversify revenue streams now'], correctAnswer: 'Diversify revenue streams now', points: 15, category: 'Strategy' },
        { id: 'q2_13', question: 'A big tech company enters your space with unlimited resources. Your move:', options: ['Sell the company', 'Go niche and specialize', 'Compete on features', 'Focus on community and brand loyalty'], correctAnswer: 'Go niche and specialize', points: 15, category: 'Strategy' },
        { id: 'q2_14', question: 'Your Series A pitch was rejected by 5 VCs. Common feedback: "too early." You:', options: ['Give up on VC funding', 'Show more traction and re-pitch', 'Lower your ask', 'Approach angel investors instead'], correctAnswer: 'Show more traction and re-pitch', points: 15, category: 'Fundraising' },
        { id: 'q2_15', question: 'Customer data breach affects 500 users. No legal obligation to disclose in your country. You:', options: ['Stay quiet and fix it', 'Disclose to affected users immediately', 'Consult lawyers first', 'Disclose publicly and offer remediation'], correctAnswer: 'Disclose publicly and offer remediation', points: 15, category: 'Ethics' },
      ],
    },
  });
  console.log(`   R2: ${round2.title} (${15} questions)`);

  // Round 3: Creativity Challenge
  const round3 = await prisma.vSCRound.create({
    data: {
      challengeId: challenge.id,
      roundNumber: 3,
      title: 'Creative Catalyst',
      description: 'Unleash your creativity. You\'ll receive a unique prompt and must craft an innovative solution. Judged on originality, feasibility, and impact.',
      roundType: 'CREATIVITY',
      timeLimit: 1200,
      passingPercent: 50,
      isActive: false,
      isLocked: true,
      prompt: 'Design a product or service that solves a real problem for college students in Tier-2 Indian cities. Your solution must be buildable with less than ₹50,000 and should generate revenue within 30 days of launch.\n\nYour submission should include:\n1. Problem Statement (What specific problem are you solving?)\n2. Solution Overview (How does your product/service work?)\n3. Revenue Model (How will you make money?)\n4. Launch Plan (How will you get your first 100 users?)\n5. Why This Will Work (What\'s your unfair advantage?)',
      scoringCriteria: [
        { criterion: 'Problem Clarity', weight: 20, maxScore: 20 },
        { criterion: 'Solution Originality', weight: 25, maxScore: 25 },
        { criterion: 'Feasibility (₹50K budget)', weight: 20, maxScore: 20 },
        { criterion: 'Revenue Viability', weight: 20, maxScore: 20 },
        { criterion: 'Presentation Quality', weight: 15, maxScore: 15 },
      ],
    },
  });
  console.log(`   R3: ${round3.title} (creative prompt)`);

  // Round 4: Execution Simulation
  const round4 = await prisma.vSCRound.create({
    data: {
      challengeId: challenge.id,
      roundNumber: 4,
      title: 'Execution Engine',
      description: 'Prove you can execute. Given a specific startup scenario, create a detailed 30-day action plan with milestones, budget allocation, and KPIs.',
      roundType: 'EXECUTION',
      timeLimit: 1500,
      passingPercent: 50,
      isActive: false,
      isLocked: true,
      prompt: 'You\'ve just received ₹2,00,000 in seed funding for a hyperlocal food delivery app targeting office workers in a Tier-2 city (population 5-10 lakh). You have a team of 3 (you + 1 developer + 1 operations person).\n\nCreate a detailed 30-day execution plan including:\n1. Week-by-week milestones and deliverables\n2. Budget breakdown (₹2L total)\n3. Key metrics/KPIs for each week\n4. Restaurant onboarding strategy\n5. Customer acquisition plan\n6. Tech stack and MVP features\n7. Risk mitigation for top 3 risks\n8. Day-30 success criteria',
      scoringCriteria: [
        { criterion: 'Plan Completeness', weight: 20, maxScore: 20 },
        { criterion: 'Budget Realism', weight: 15, maxScore: 15 },
        { criterion: 'Milestone Clarity', weight: 20, maxScore: 20 },
        { criterion: 'Strategic Thinking', weight: 25, maxScore: 25 },
        { criterion: 'Risk Assessment', weight: 20, maxScore: 20 },
      ],
    },
  });
  console.log(`   R4: ${round4.title} (execution prompt)`);

  // Round 5: Pressure Round
  const round5 = await prisma.vSCRound.create({
    data: {
      challengeId: challenge.id,
      roundNumber: 5,
      title: 'Pressure Cooker',
      description: 'Handle intense pressure. Rapid-fire difficult questions with tight time limits. Designed to test how you perform under stress.',
      roundType: 'PRESSURE',
      timeLimit: 300,
      passingPercent: 50,
      isActive: false,
      isLocked: true,
      questionPool: [
        { id: 'q5_01', question: 'Your server crashes during a product launch with 10K users online. First action?', options: ['Post on social media', 'Roll back to last stable version', 'Debug the issue live', 'Scale up server resources'], correctAnswer: 'Roll back to last stable version', points: 20, category: 'Crisis' },
        { id: 'q5_02', question: 'Investor meeting in 5 minutes. You realize your pitch deck has wrong revenue numbers. You:', options: ['Present anyway', 'Correct verbally during pitch', 'Ask to reschedule', 'Skip the revenue slide'], correctAnswer: 'Correct verbally during pitch', points: 20, category: 'Crisis' },
        { id: 'q5_03', question: 'Your entire dev team (3 people) quit on the same day. Immediate priority?', options: ['Sue them', 'Secure all code and access', 'Hire replacements', 'Call investors'], correctAnswer: 'Secure all code and access', points: 20, category: 'Crisis' },
        { id: 'q5_04', question: 'Media publishes a negative article about your startup. It\'s trending. You:', options: ['Ignore it', 'Issue legal notice', 'Respond transparently on social media', 'Call the journalist'], correctAnswer: 'Respond transparently on social media', points: 20, category: 'PR' },
        { id: 'q5_05', question: 'Your payment gateway fails during a flash sale. 500 orders stuck. You:', options: ['Cancel all orders', 'Switch to backup gateway', 'Process manually', 'Email customers to retry later'], correctAnswer: 'Switch to backup gateway', points: 20, category: 'Crisis' },
        { id: 'q5_06', question: 'Co-founder goes to media claiming you stole the idea. Truth: you co-created it. Response?', options: ['Counter-attack publicly', 'Show documentation of co-creation', 'Ignore and focus on work', 'Lawyer up immediately'], correctAnswer: 'Show documentation of co-creation', points: 20, category: 'Crisis' },
        { id: 'q5_07', question: 'Client discovers a bug that leaked their data (10 records). No media coverage yet. You:', options: ['Patch silently', 'Inform client, patch, offer remediation', 'Wait to see if they notice', 'Blame it on third-party service'], correctAnswer: 'Inform client, patch, offer remediation', points: 20, category: 'Ethics' },
        { id: 'q5_08', question: 'You have 48 hours to deliver a demo to your biggest potential client. Feature isn\'t ready. You:', options: ['Ask for extension', 'Demo what you have with a vision walkthrough', 'Pull an all-nighter to finish', 'Show a competitor\'s product as inspiration'], correctAnswer: 'Demo what you have with a vision walkthrough', points: 20, category: 'Sales' },
        { id: 'q5_09', question: 'Your AWS bill just came in at ₹3L instead of expected ₹30K. Reason unknown. First step?', options: ['Call AWS support', 'Check billing dashboard for spikes', 'Shut down all services', 'Panic'], correctAnswer: 'Check billing dashboard for spikes', points: 20, category: 'Operations' },
        { id: 'q5_10', question: 'Key employee is poached by a competitor 2 days before product launch. You:', options: ['Delay the launch', 'Redistribute their tasks immediately', 'Offer a counter-offer', 'Launch with reduced scope'], correctAnswer: 'Redistribute their tasks immediately', points: 20, category: 'Leadership' },
        { id: 'q5_11', question: 'During a live demo, the app crashes. 50 investors watching. You:', options: ['Blame internet connectivity', 'Switch to backup demo/screenshots', 'Try to restart and fix', 'End the demo early'], correctAnswer: 'Switch to backup demo/screenshots', points: 20, category: 'Sales' },
        { id: 'q5_12', question: 'Your MVP just got 1-star reviews on app store. Common complaint: "too slow". Quick fix?', options: ['Remove the app and relaunch', 'Respond to each review', 'Optimize performance immediately', 'Add more features to distract'], correctAnswer: 'Optimize performance immediately', points: 20, category: 'Product' },
      ],
    },
  });
  console.log(`   R5: ${round5.title} (${12} questions)`);

  // Round 6: Social Proof
  const round6 = await prisma.vSCRound.create({
    data: {
      challengeId: challenge.id,
      roundNumber: 6,
      title: 'Social Proof',
      description: 'Build real social proof. Share your journey, rally supporters, and demonstrate your ability to build a community around your work.',
      roundType: 'SOCIAL_PROOF',
      timeLimit: 86400,
      passingPercent: 40,
      isActive: false,
      isLocked: true,
      prompt: 'This round tests your ability to build social proof and rally support — a critical startup skill.\n\nTasks:\n1. Share your VSC journey on any social platform (LinkedIn, Twitter/X, Instagram)\n2. Get at least 3 referrals using your unique referral code\n3. Write a brief summary of what you\'ve learned so far\n\nYou\'ll be scored on:\n- Number of referrals generated\n- Quality of your social post\n- Engagement received\n- Summary depth and authenticity',
      scoringCriteria: [
        { criterion: 'Referral Count', weight: 30, maxScore: 30 },
        { criterion: 'Social Post Quality', weight: 25, maxScore: 25 },
        { criterion: 'Engagement Metrics', weight: 20, maxScore: 20 },
        { criterion: 'Learning Summary', weight: 25, maxScore: 25 },
      ],
    },
  });
  console.log(`   R6: ${round6.title} (social proof)`);

  // Round 7: Final Video Pitch
  const round7 = await prisma.vSCRound.create({
    data: {
      challengeId: challenge.id,
      roundNumber: 7,
      title: 'The Final Pitch',
      description: 'Record a 2-minute video pitch. Present your best startup idea, demonstrate your passion, and convince the judges you deserve to win.',
      roundType: 'VIDEO_PITCH',
      timeLimit: 172800,
      passingPercent: 50,
      isActive: false,
      isLocked: true,
      prompt: 'Record a 2-minute video pitch for your best startup idea.\n\nYour pitch must cover:\n1. The Problem (30 sec) — What problem are you solving and for whom?\n2. The Solution (30 sec) — How does your product/service solve it?\n3. The Market (20 sec) — How big is the opportunity?\n4. Traction/Plan (20 sec) — What have you done or plan to do?\n5. The Ask (20 sec) — What do you need to make this happen?\n\nRules:\n- Maximum 2 minutes\n- Face must be visible\n- Upload to YouTube (unlisted) and submit the link\n- No slides required but allowed\n- Judged by panel on content, delivery, and conviction',
      scoringCriteria: [
        { criterion: 'Problem Clarity', weight: 20, maxScore: 20 },
        { criterion: 'Solution Innovation', weight: 20, maxScore: 20 },
        { criterion: 'Presentation & Delivery', weight: 25, maxScore: 25 },
        { criterion: 'Market Understanding', weight: 15, maxScore: 15 },
        { criterion: 'Passion & Conviction', weight: 20, maxScore: 20 },
      ],
    },
  });
  console.log(`   R7: ${round7.title} (video pitch)`);

  console.log('\n🔥 VSC Challenge seeded successfully!');
  console.log(`   Challenge ID: ${challenge.id}`);
  console.log('   7 rounds created with question pools and prompts');
  console.log('   Round 1 is ACTIVE and UNLOCKED — ready for participants');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('❌ VSC seeding failed:', e);
  process.exit(1);
});
