import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || '';
  const isRDS = connectionString.includes('rds.amazonaws.com');

  // For AWS RDS: disable Node TLS verification globally before any connection
  if (isRDS) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const pool = new pg.Pool({
    connectionString,
    // Force SSL with rejectUnauthorized: false for RDS self-signed certs
    ssl: isRDS ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });

  const adapter = new PrismaPg(pool);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any) as PrismaClient;
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
