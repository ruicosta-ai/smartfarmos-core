import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@sfos.local';
  const name = 'Admin';
  const password = 'Admin!123';

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await argon2.hash(password);
    user = await prisma.user.create({ data: { email, name, passwordHash } });
  }

  const farm = await prisma.farm.findFirst({ orderBy: { createdAt: 'desc' } });
  if (farm) {
    await prisma.userFarm.upsert({
      where: { userId_farmId: { userId: user.id, farmId: farm.id } },
      update: { role: 'OWNER' },
      create: { userId: user.id, farmId: farm.id, role: 'OWNER' },
    });
  }
}
main().finally(async () => { await prisma.$disconnect(); });
