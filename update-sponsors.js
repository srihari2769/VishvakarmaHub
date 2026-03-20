require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

(async () => {
  const connectionString = process.env.DATABASE_URL || '';
  const isRDS = connectionString.includes('rds.amazonaws.com');
  if (isRDS) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const pool = new pg.Pool({
    connectionString,
    ssl: isRDS ? { rejectUnauthorized: false } : undefined,
    max: 2,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const comp = await prisma.competition.findFirst();
  if (!comp) { console.log('No competition found'); process.exit(1); }

  // Update competition dates to new timeline
  await prisma.competition.update({
    where: { id: comp.id },
    data: {
      registrationStart: new Date('2026-03-23'),
      registrationEnd: new Date('2026-05-23'),
      screeningEnd: new Date('2026-06-05'),
      votingEnd: new Date('2026-07-10'),
      finalsDate: new Date('2026-07-23'),
    }
  });
  console.log('Updated competition dates successfully');
  await pool.end();
})();
