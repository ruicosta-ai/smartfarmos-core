import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@UseGuards(AuthGuard('jwt'))
@Controller('farms')
export class FarmsController {
  constructor(private readonly farms: FarmsService, private readonly users: UsersService) {}

  @Get()
  async list(@Req() req: any, @Query('page') pageRaw?: string, @Query('limit') limitRaw?: string) {
    const userId = req.user.sub;
    const farmIds = await this.users.getUserFarmIds(userId);
    const page = Math.max(parseInt(pageRaw || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(limitRaw || '20', 10), 1), 100);
    const skip = (page - 1) * limit;
    const data = await this.farms.listForUserPaged(farmIds, skip, limit);
    const total = await this.farms.countForUser(farmIds);
    return { page, limit, total, data };
  }

  @Post()
  async create(@Req() req: any, @Body() body: CreateFarmDto) {
    const userId = req.user.sub;
    return this.farms.createWithOwner(userId, body);
  }

  @Post(':id/join')
  async joinMine(@Req() req: any, @Param('id') farmId: string) {
    const userId = req.user.sub;
    return this.farms.addMember(farmId, userId, 'OWNER');
  }
}
