import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos';
import { MaterialStatus, MaterialType, MaterialVisibility } from '@prisma/client';

export class MaterialQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MaterialStatus })
  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @ApiPropertyOptional({ enum: MaterialType })
  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;

  @ApiPropertyOptional({ enum: MaterialVisibility })
  @IsOptional()
  @IsEnum(MaterialVisibility)
  visibility?: MaterialVisibility;

  @ApiPropertyOptional({ description: 'Filter by author UUID' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by subject UUID' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by grade UUID' })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'Filter by tag slug' })
  @IsOptional()
  @IsString()
  tagSlug?: string;
}
