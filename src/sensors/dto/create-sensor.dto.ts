import { IsOptional, IsString } from 'class-validator';

export class CreateSensorDto {
  @IsString()
  farmId: string;

  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  unit?: string;
}
