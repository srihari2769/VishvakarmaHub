import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter } as any);

  console.log('🌱 Seeding database...');

  // Hash admin password
  const hashedPassword = await bcrypt.hash('Admin@VishvakarmaHub', 12);

  // Upsert admin user (create if not exists, update if exists)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vishvakarmahub.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
    create: {
      email: 'admin@vishvakarmahub.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'VishvakarmaHub',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log('✅ Admin user created/updated:');
  console.log(`   Email: admin@vishvakarmahub.com`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   ID: ${admin.id}`);

  await prisma.$disconnect();
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });
