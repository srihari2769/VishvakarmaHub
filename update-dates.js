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

  const result = await prisma.competition.updateMany({
    where: { isActive: true },
    data: {
      registrationStart: new Date('2026-03-25'),
      registrationEnd: new Date('2026-05-25'),
    },
  });
  console.log('Updated:', result);
  await pool.end();
}

main();
