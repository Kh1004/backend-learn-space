import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  action: ActivityType;

  @ApiProperty({ example: 'Material' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  resourceType: string;

  @ApiProperty({ description: 'Resource UUID' })
  @IsUUID()
  resourceId: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
