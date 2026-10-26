import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MaterialAuthorDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;
}

class MaterialCategoryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Science' })
  name: string;

  @ApiProperty({ example: 'science' })
  slug: string;
}

class MaterialSubjectDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Physics' })
  name: string;

  @ApiProperty({ example: 'physics' })
  slug: string;
}

class MaterialGradeDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Grade 10' })
  name: string;

  @ApiProperty({ example: 'grade-10' })
  slug: string;

  @ApiProperty({ example: 10 })
  level: number;
}

class MaterialTagDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'exam' })
  name: string;

  @ApiProperty({ example: 'exam' })
  slug: string;
}

class MaterialFileDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'report.pdf' })
  filename: string;

  @ApiProperty({ example: 'Math Report.pdf' })
  originalName: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 102400 })
  size: number;

  @ApiPropertyOptional({ example: '/uploads/report.pdf' })
  url?: string;
}

export class MaterialResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Calculus Notes' })
  title: string;

  @ApiProperty({ example: 'calculus-notes' })
  slug: string;

  @ApiPropertyOptional({ example: 'Notes on differential calculus' })
  description?: string;

  @ApiProperty({ example: 'NOTE' })
  type: string;

  @ApiProperty({ example: 'PUBLISHED' })
  status: string;

  @ApiProperty({ example: 'PUBLIC' })
  visibility: string;

  @ApiProperty({ example: 'en' })
  language: string;

  @ApiProperty({ example: 0 })
  viewCount: number;

  @ApiProperty({ example: 0 })
  downloadCount: number;

  @ApiProperty({ example: 0 })
  bookmarkCount: number;

  @ApiProperty({ example: 0 })
  likeCount: number;

  @ApiProperty({ example: 0 })
  commentCount: number;

  @ApiPropertyOptional({ example: 15 })
  readingTime?: number;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  publishedAt?: Date;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: MaterialAuthorDto })
  author: MaterialAuthorDto;

  @ApiPropertyOptional({ type: MaterialCategoryDto })
  category?: MaterialCategoryDto;

  @ApiPropertyOptional({ type: [MaterialSubjectDto] })
  subjects?: { subject: MaterialSubjectDto }[];

  @ApiPropertyOptional({ type: [MaterialGradeDto] })
  grades?: { grade: MaterialGradeDto }[];

  @ApiPropertyOptional({ type: [MaterialTagDto] })
  tags?: { tag: MaterialTagDto }[];

  @ApiPropertyOptional({ type: [MaterialFileDto] })
  files?: { file: MaterialFileDto; isPrimary: boolean; sortOrder: number; label?: string }[];
}
