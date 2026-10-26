import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'exam-prep' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}
