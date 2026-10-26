import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ description: 'Material UUID' })
  @IsUUID()
  @IsNotEmpty()
  materialId: string;

  @ApiProperty({ example: 5, description: 'Current page number' })
  @IsInt()
  @Min(0)
  currentPage: number;

  @ApiProperty({ example: 45.5, description: 'Progress percentage (0-100)' })
  @Min(0)
  @Max(100)
  progressPercent: number;

  @ApiPropertyOptional({ example: 120, description: 'Reading time in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  readingTime?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isCompleted?: boolean;
}
