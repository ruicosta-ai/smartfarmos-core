import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UsersService } from '../users/users.service';

@UseGuards(JwtAuthGuard)
@Controller('farms')
export class FarmsController {
  constructor(
    private readonly farms: FarmsService,
    private readonly users: UsersService,
  ) {}

  @Get()
  async list(
    @Req() req: Request & { user: { sub: string } },
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const userId = req.user.sub;
    const farmIds = await this.users.getUserFarmIds(userId);
    const page = Math.max(parseInt(pageRaw || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(limitRaw || '20', 10), 1), 100);
    const skip = (page - 1) * limit;
    const data = await this.farms.listForUserPaged(farmIds, skip, limit);
    const total = await this.farms.countForUser(farmIds);
    return { page, limit, total, data, totalPages: Math.ceil(total / limit) };
  }

  @Post()
  async create(
    @Req() req: Request & { user: { sub: string } },
    @Body() body: CreateFarmDto,
  ) {
    const userId = req.user.sub;
    return this.farms.createWithOwner(userId, body);
  }

  @Post(':id/join')
  async joinMine(
    @Req() req: Request & { user: { sub: string } },
    @Param('id') farmId: string,
  ) {
    const userId = req.user.sub;
    return this.farms.addMember(farmId, userId, 'MANAGER');
  }

  @Delete(':id')
  async deleteFarm(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.farms.deleteFarm(id, userId);
  }
}