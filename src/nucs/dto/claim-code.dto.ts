import { IsString, IsNotEmpty } from 'class-validator';

export class CreateClaimCodeDto {
  @IsString()
  @IsNotEmpty()
  farmId: string;
}

export class ClaimNucDto {
  @IsString()
  @IsNotEmpty()
  claimCode: string;

  @IsString()
  deviceFingerprint: string;

  @IsString()
  agentVersion?: string;

  @IsString()
  endpoint?: string;
}