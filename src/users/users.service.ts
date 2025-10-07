import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(email: string, name: string, password: string) {
    const passwordHash = await argon2.hash(password);
    return this.prisma.user.create({ data: { email, name, passwordHash } });
  }

  async validate(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const ok = await argon2.verify(user.passwordHash, password);
    return ok ? user : null;
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        farms: { include: { farm: true } },
      },
    });
  }

  async getUserFarmIds(userId: string): Promise<string[]> {
    const links = await this.prisma.userFarm.findMany({
      where: { userId },
      select: { farmId: true },
    });
    return links.map(l => l.farmId);
  }
}
