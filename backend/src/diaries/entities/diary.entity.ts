import { ApiProperty } from '@nestjs/swagger';

export class Tag {
  @ApiProperty({ description: '태그 ID' })
  id: number;

  @ApiProperty({ description: '태그 이름' })
  name: string;
}

export class DiaryTag {
  @ApiProperty({ description: '일기-태그 연결 ID' })
  id: number;

  @ApiProperty({ description: '일기 ID' })
  diaryId: number;

  @ApiProperty({ description: '태그 ID' })
  tagId: number;

  @ApiProperty({ description: '태그 정보', type: Tag })
  tag: Tag;
}

export class User {
  @ApiProperty({ description: '사용자 ID' })
  id: string; // number에서 string으로 변경

  @ApiProperty({ description: '사용자 이름' })
  username: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  profileImage?: string;
}

export class Diary {
  @ApiProperty({ description: '일기 ID' })
  id: number;

  @ApiProperty({ description: '일기 제목', required: false })
  title?: string;

  @ApiProperty({ description: '일기 내용' })
  content: string;

  @ApiProperty({ description: '기분 상태', required: false })
  mood?: string;

  @ApiProperty({ description: '날씨', required: false })
  weather?: string;

  @ApiProperty({ description: '공개 여부', default: true })
  isPrivate: boolean;

  @ApiProperty({ description: '작성자 ID' })
  userId: string; // number에서 string으로 변경

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiProperty({ description: '작성자 정보', type: User })
  user?: User;

  @ApiProperty({ description: '태그 목록', type: [DiaryTag] })
  tags?: DiaryTag[];
}