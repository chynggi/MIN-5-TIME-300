import { IsString, IsNotEmpty } from 'class-validator';

export class BlockUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export interface BlockResponseDto {
  success: boolean;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}