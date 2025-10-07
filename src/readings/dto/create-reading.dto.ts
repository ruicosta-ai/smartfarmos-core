import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReadingDto {
  @IsString()
  sensorId: string;

  @IsNumber()
  value: number;

  @IsOptional()
  ts?: Date;
}
