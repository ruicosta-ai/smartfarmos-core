import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensors: SensorsService, private readonly users: UsersService) {}

  @Get()
  async list(@Req() req: any, @Query('farmId') farmId?: string) {
    const farmIds = await this.users.getUserFarmIds(req.user.sub);
    return this.sensors.listForUser(farmIds, farmId);
  }

  @Post()
  async create(@Req() req: any, @Body() body: CreateSensorDto) {
    const farmIds = await this.users.getUserFarmIds(req.user.sub);
    return this.sensors.createForUser(farmIds, body);
  }
}
