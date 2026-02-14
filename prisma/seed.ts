import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Delete all existing users first
  await prisma.user.deleteMany({});
  console.log('Deleted all existing users');

  // Create users with different roles
  const users = [
    {
      email: 'admin@cafesystem.com',
      password: 'admin123',
      name: 'Admin',
      role: 'ADMIN' as const,
    },
    {
      email: 'captain@cafesystem.com',
      password: 'captain123',
      name: 'Captain',
      role: 'CAPTAIN' as const,
    },
    {
      email: 'cashier@cafesystem.com',
      password: 'cashier123',
      name: 'Cashier',
      role: 'CASHIER' as const,
    },
  ];

  // Hash passwords and create/update users
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    console.log(`Created/Updated user: ${user.email} (${user.role})`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
