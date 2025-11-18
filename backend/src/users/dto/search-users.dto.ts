import { IsOptional, IsString } from 'class-validator';

export class SearchUsersDto {
  @IsOptional()
  @IsString()
  q?: string; // 검색 쿼리 (선택)

  @IsOptional()
  @IsString()
  limit?: string = '10'; // 검색 결과 제한

  @IsOptional()
  @IsString()
  minAge?: string;

  @IsOptional()
  @IsString()
  maxAge?: string;

  @IsOptional()
  @IsString()
  mbti?: string; // 콤마 구분 목록

  @IsOptional()
  @IsString()
  interestTags?: string; // 콤마 구분 목록 (music,movies,art,games)

  @IsOptional()
  @IsString()
  timePref?: string; // sun,moon,question

  @IsOptional()
  @IsString()
  socialType?: string; // 집순이/집돌이/밖순이/밖돌이 (콤마 구분)

  @IsOptional()
  @IsString()
  inactiveDays?: string; // 활동 제외 기준 일수 (기본 30)
}
