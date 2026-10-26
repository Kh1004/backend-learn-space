import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateTeacherProfileDto {
  @ApiPropertyOptional({ example: 'Experienced mathematics educator.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ example: 'State University' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institution?: string;

  @ApiPropertyOptional({ example: ['Algebra', 'Calculus'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];

  @ApiPropertyOptional({ example: 'Ph.D. Mathematics' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  qualification?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ description: 'Social media links' })
  @IsOptional()
  socialLinks?: Record<string, string>;
}
