import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Reset all tables with stable IDs each run
  await prisma.$executeRaw`TRUNCATE "Expense", "Chore" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE "User" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE "Household" RESTART IDENTITY CASCADE`;

  const hash = (pw) => bcrypt.hash(pw, 10);

  // Create households
  const house1 = await prisma.household.create({ data: { name: 'Arcadia House' } });
  const house2 = await prisma.household.create({ data: { name: 'Maple Street Home' } });

  // Create users
  const nina = await prisma.user.create({
    data: {
      email: 'nina@example.com',
      password: await hash('Password123!'),
      name: 'Nina Bernardino',
      role: 'admin',
      householdId: house1.id,
    },
  });

  const alexis = await prisma.user.create({
    data: {
      email: 'alexis@example.com',
      password: await hash('Password123!'),
      name: 'Alexis Pearson',
      role: 'member',
      householdId: house1.id,
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: 'marcus@example.com',
      password: await hash('Password123!'),
      name: 'Marcus Rivera',
      role: 'member',
      householdId: house1.id,
    },
  });

  const jordan = await prisma.user.create({
    data: {
      email: 'jordan@example.com',
      password: await hash('Password123!'),
      name: 'Jordan Lee',
      role: 'admin',
      householdId: house2.id,
    },
  });

  const sam = await prisma.user.create({
    data: {
      email: 'sam@example.com',
      password: await hash('Password123!'),
      name: 'Sam Chen',
      role: 'member',
      householdId: house2.id,
    },
  });

  // No-household user (can create or join a household)
  await prisma.user.create({
    data: {
      email: 'newuser@example.com',
      password: await hash('Password123!'),
      name: 'New User',
      role: 'member',
      householdId: null,
    },
  });

  // Chores for Arcadia House
  await prisma.chore.createMany({
    data: [
      { name: 'Vacuum living room', status: false, assignedToId: alexis.id, householdId: house1.id },
      { name: 'Take out trash', status: true, assignedToId: nina.id, householdId: house1.id },
      { name: 'Clean bathroom', status: false, assignedToId: marcus.id, householdId: house1.id },
      { name: 'Do laundry', status: false, assignedToId: alexis.id, householdId: house1.id },
    ],
  });

  // Expenses for Arcadia House (3 members → splitAmount = cost / 3)
  await prisma.expense.createMany({
    data: [
      { name: 'Groceries', cost: 90, createdById: nina.id, householdId: house1.id },
      { name: 'Internet bill', cost: 60, createdById: alexis.id, householdId: house1.id },
      { name: 'Cleaning supplies', cost: 30, createdById: marcus.id, householdId: house1.id },
    ],
  });

  // Chores for Maple Street Home
  await prisma.chore.createMany({
    data: [
      { name: 'Wash dishes', status: false, assignedToId: sam.id, householdId: house2.id },
      { name: 'Mow lawn', status: false, assignedToId: jordan.id, householdId: house2.id },
    ],
  });

  // Expenses for Maple Street Home (2 members → splitAmount = cost / 2)
  await prisma.expense.createMany({
    data: [
      { name: 'Electricity', cost: 120, createdById: jordan.id, householdId: house2.id },
    ],
  });

  console.log('✅ Seed complete');
  console.log('');
  console.log('Test credentials:');
  console.log('  Admin (Arcadia House):  nina@example.com    / Password123!');
  console.log('  Member (Arcadia House): alexis@example.com  / Password123!');
  console.log('  Member (Arcadia House): marcus@example.com  / Password123!');
  console.log('  Admin (Maple St Home):  jordan@example.com  / Password123!');
  console.log('  Member (Maple St Home): sam@example.com     / Password123!');
  console.log('  No household:           newuser@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
