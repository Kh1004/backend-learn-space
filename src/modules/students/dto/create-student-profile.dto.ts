import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateStudentProfileDto {
  @ApiPropertyOptional({ description: 'Grade UUID' })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiPropertyOptional({ example: 'Central High School' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institution?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  enrollmentYear?: number;

  @ApiPropertyOptional({ example: ['Mathematics', 'Computer Science'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ example: 60, description: 'Weekly reading goal in minutes' })
  @IsOptional()
  readingGoal?: number;
}
