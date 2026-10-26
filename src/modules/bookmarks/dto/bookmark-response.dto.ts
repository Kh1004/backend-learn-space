import { ApiProperty } from '@nestjs/swagger';

class BookmarkMaterialAuthorDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;
}

class BookmarkMaterialCategoryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Science' })
  name: string;

  @ApiProperty({ example: 'science' })
  slug: string;
}

class BookmarkMaterialDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Calculus Notes' })
  title: string;

  @ApiProperty({ example: 'calculus-notes' })
  slug: string;

  @ApiProperty({ example: 'NOTE' })
  type: string;

  @ApiProperty({ example: 'PUBLISHED' })
  status: string;

  @ApiProperty({ example: 15 })
  readingTime: number;

  @ApiProperty({ example: 42 })
  viewCount: number;

  @ApiProperty({ type: BookmarkMaterialAuthorDto })
  author: BookmarkMaterialAuthorDto;

  @ApiProperty({ type: BookmarkMaterialCategoryDto })
  category: BookmarkMaterialCategoryDto;
}

export class BookmarkResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: BookmarkMaterialDto })
  material: BookmarkMaterialDto;
}
