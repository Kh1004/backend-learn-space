import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SettingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
