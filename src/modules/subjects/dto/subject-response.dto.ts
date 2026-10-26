import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubjectResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Mathematics' })
  name: string;

  @ApiProperty({ example: 'mathematics' })
  slug: string;

  @ApiPropertyOptional({ example: 'Algebra, calculus, statistics and more' })
  description?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
