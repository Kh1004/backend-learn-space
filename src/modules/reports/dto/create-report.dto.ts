import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ description: 'Material UUID to report' })
  @IsUUID()
  materialId: string;

  @ApiProperty({ example: 'inappropriate', description: 'Reason for report' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reason: string;

  @ApiPropertyOptional({ example: 'This content contains...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
