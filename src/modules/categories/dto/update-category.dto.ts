import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Past Papers' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsOptional()
  parentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}
