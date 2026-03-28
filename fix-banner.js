process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:VishvakarmaHub2026@vishvakarmahub.cno2sysqypnb.ap-southeast-2.rds.amazonaws.com:5432/postgres?sslmode=require',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  const c = await prisma.competition.findFirst({
    where: { isActive: true },
    select: { id: true, pageContent: true },
  });
  const pc = c.pageContent || {};
  pc.bannerText = "You're Invited! India's Biggest Startup Competition is LIVE";
  pc.bannerButtonText = "Register Now — From \u20b9199 Only!";
  await prisma.competition.update({
    where: { id: c.id },
    data: { pageContent: pc },
  });
  console.log('Updated banner text successfully');
  pool.end();
})().catch((e) => {
  console.error(e);
  pool.end();
});
