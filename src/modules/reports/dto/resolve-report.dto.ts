import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveReportDto {
  @ApiPropertyOptional({ example: 'Content removed after review' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;
}
