import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;
}

class AnswerDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  authorId: number;

  @ApiProperty({ type: UserDto, nullable: true })
  author?: UserDto;

  @ApiProperty()
  createdAt: Date;
}

export class QuestionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ type: UserDto, nullable: true })
  author?: UserDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isAnswered: boolean;

  @ApiProperty({ type: [String], nullable: true })
  tags?: string[];

  @ApiProperty({ type: [AnswerDto], nullable: true })
  answers?: AnswerDto[];
}