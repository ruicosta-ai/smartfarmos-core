import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ReadingsService } from './readings.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('readings')
export class ReadingsController {
  constructor(private readonly readings: ReadingsService, private readonly users: UsersService) {}

  @Post()
  async create(@Req() req: any, @Body() body: CreateReadingDto) {
    const farmIds = await this.users.getUserFarmIds(req.user.sub);
    return this.readings.createForUser(farmIds, body);
  }

  @Get()
  async list(@Req() req: any, @Query('sensorId') sensorId?: string, @Query('limit') limitRaw?: string) {
    const farmIds = await this.users.getUserFarmIds(req.user.sub);
    const limit = limitRaw ? Math.min(parseInt(limitRaw, 10) || 50, 500) : 50;
    return this.readings.listForUser(farmIds, sensorId, limit);
  }
}
