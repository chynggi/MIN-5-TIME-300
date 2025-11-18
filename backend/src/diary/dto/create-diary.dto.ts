import {
  IsString,
  IsOptional,
  IsBooleanString,
  IsNumberString,
  IsIn,
} from 'class-validator';

export class CreateDiaryDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  questionId?: string;

  @IsOptional()
  @IsString()
  questionModel?: string; // 질문 생성에 사용된 AI 모델 id (요약 모델 동기화 목적)

  // 사용자가 선택한 질문 세트(질문형 작성 재편집용): 도메인/텍스트 배열
  // FormData로 전송 시 selectedQuestionDomains[]=emotion&selectedQuestionDomains[]=action 형태 또는
  // JSON 문자열("[\"emotion\",\"action\"]")를 허용하며, 서비스에서 배열로 정규화합니다.
  @IsOptional()
  selectedQuestionDomains?: string[] | string; // multipart: 반복 키 배열 or JSON 문자열

  @IsOptional()
  selectedQuestionTexts?: string[] | string; // multipart: 반복 키 배열 or JSON 문자열

  @IsOptional()
  @IsBooleanString()
  isPublic?: string; // 'true' | 'false'

  @IsOptional()
  @IsString()
  emotion?: string; // 감정 이모지 필드 추가

  @IsOptional()
  @IsString()
  diaryDate?: string; // 일기 날짜 필드 추가 (ISO 문자열)

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  mediaType?: string;

  @IsOptional()
  @IsString()
  music?: string; // Spotify track payload(JSON 문자열)

  // 기본 프리셋 이미지 키 (spring, summer, autumn, winter, sunny, night, rain, snow)
  @IsOptional()
  @IsString()
  preset?: string;

  @IsOptional()
  @IsIn(['public', 'private', 'friends'])
  postVisibility?: string;

  @IsOptional()
  @IsIn(['public', 'private'])
  contentVisibility?: string;

  @IsOptional()
  @IsIn(['sunny', 'cloudy', 'rainy', 'snowy', 'night', 'rain', 'snow'])
  weather?: string;

  @IsNumberString()
  writingDuration: string; // FormData에서 문자열로 전달

  @IsOptional()
  @IsNumberString()
  lat?: string;

  @IsOptional()
  @IsNumberString()
  lng?: string;

  @IsOptional()
  @IsNumberString()
  voiceDuration?: string;

  @IsOptional()
  @IsBooleanString()
  removeVoice?: string;

  @IsOptional()
  @IsBooleanString()
  removeMusic?: string;

  // 일기 완성하기 버튼 여부: 'true'일 때 최종 요약 실행
  @IsOptional()
  @IsBooleanString()
  finalize?: string;
}
