import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({ example: 'Violation of terms of service' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  suspendedUntil?: string;
}
