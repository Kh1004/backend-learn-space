import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MaterialType, MaterialVisibility } from '@prisma/client';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Calculus 101 Study Guide' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'A comprehensive guide to introductory calculus.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'Full markdown content...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: MaterialType, default: MaterialType.NOTE })
  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;

  @ApiPropertyOptional({ enum: MaterialVisibility, default: MaterialVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(MaterialVisibility)
  visibility?: MaterialVisibility;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({ description: 'Category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Thumbnail file UUID' })
  @IsOptional()
  @IsUUID()
  thumbnailId?: string;

  @ApiPropertyOptional({ description: 'Subject UUIDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  subjectIds?: string[];

  @ApiPropertyOptional({ description: 'Grade UUIDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  gradeIds?: string[];

  @ApiPropertyOptional({ description: 'Tag UUIDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'File UUIDs to attach', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds?: string[];

  @ApiPropertyOptional({ description: 'Estimated reading time in minutes' })
  @IsOptional()
  readingTime?: number;

  @ApiPropertyOptional({ description: "Allowed Student UUIDs for Restricted (GROUP) visibility", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedStudentIds?: string[];

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
