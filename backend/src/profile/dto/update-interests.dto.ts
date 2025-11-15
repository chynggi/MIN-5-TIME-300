import {
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class InterestInputDto {
  @IsString()
  interest: string;

  @IsInt()
  @Min(1)
  @Max(5)
  priority: number;
}

export class UpdateInterestsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterestInputDto)
  interests: InterestInputDto[];
}

export class InterestResponseDto {
  id: string;
  interest: string;
  priority: number;
}
