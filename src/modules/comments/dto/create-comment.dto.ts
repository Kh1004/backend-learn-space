import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Material UUID' })
  @IsUUID()
  materialId: string;

  @ApiPropertyOptional({ description: 'Parent comment UUID for replies' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: 'Great explanation!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
