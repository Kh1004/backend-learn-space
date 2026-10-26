import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dtos';

export class SearchQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: 'calculus', description: 'Search query' })
  @IsString()
  @IsNotEmpty()
  q: string;

  @ApiPropertyOptional({ example: 'material,subject', description: 'Comma-separated types to search' })
  @IsOptional()
  @IsString()
  types?: string;
}
