import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Required for AWS RDS SSL: the PrismaPg adapter opens its own TLS connection
// that rejects self-signed certificates unless this is set globally.
if (process.env.DATABASE_URL?.includes('rds.amazonaws.com')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes('rds.amazonaws.com')
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
