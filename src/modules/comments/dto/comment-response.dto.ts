import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CommentUserDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;
}

export class CommentResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Great material, thanks!' })
  content: string;

  @ApiProperty({ example: 'ROOT' })
  type: string;

  @ApiProperty({ example: 5 })
  likeCount: number;

  @ApiProperty({ example: false })
  isEdited: boolean;

  @ApiProperty({ example: false })
  isPinned: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: CommentUserDto })
  user: CommentUserDto;

  @ApiPropertyOptional({ type: () => [CommentResponseDto] })
  replies?: CommentResponseDto[];
}
