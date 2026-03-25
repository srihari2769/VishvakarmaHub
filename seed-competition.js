const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const pool = new Pool({
    connectionString: 'postgresql://postgres:VishvakarmaHub2026@vishvakarmahub.cno2sysqypnb.ap-southeast-2.rds.amazonaws.com:5432/postgres?sslmode=require',
    max: 2,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.competition.findFirst({ where: { slug: 'vishvakarma-innovation-challenge-2026' } });
  if (existing) {
    console.log('Competition already exists:', existing.id);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  const comp = await prisma.competition.create({
    data: {
      name: 'Vishvakarma Innovation Challenge 2026',
      tagline: 'Build the Future. Launch Your Startup.',
      slug: 'vishvakarma-innovation-challenge-2026',
      description: 'The Vishvakarma Innovation Challenge 2026 is a national-level startup competition designed to discover, showcase, and launch the most promising innovations from across India. Open to students, engineers, founders, innovators, and researchers — this is your stage to turn bold ideas into real startups.\n\nWhether you are at the idea stage or have a working prototype, this competition gives you access to expert evaluation, public visibility, community engagement, and a platform to pitch to top founders, investors, and industry experts.\n\nThe top startups will be selected through a rigorous multi-phase process including jury screening, public voting, and a live pitch round.',
      currentPhase: 'REGISTRATION',
      registrationStart: new Date('2026-03-25'),
      registrationEnd: new Date('2026-05-25'),
      screeningEnd: new Date('2026-04-20'),
      votingEnd: new Date('2026-05-05'),
      finalsDate: new Date('2026-05-15'),
      isActive: true,
    },
  });
  console.log('Competition created:', comp.id);
  
  // Also ensure site_settings exists
  const settings = await prisma.siteSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global', comingSoon: false },
  });
  console.log('Site settings initialized, comingSoon:', settings.comingSoon);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
