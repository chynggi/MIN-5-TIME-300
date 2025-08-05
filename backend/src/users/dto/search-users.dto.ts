import { IsOptional, IsString } from 'class-validator';

export class SearchUsersDto {
  @IsString()
  q: string; // 검색 쿼리

  @IsOptional()
  @IsString()
  limit?: string = '10'; // 검색 결과 제한
}
