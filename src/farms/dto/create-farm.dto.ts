import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFarmDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  location?: string;
}
