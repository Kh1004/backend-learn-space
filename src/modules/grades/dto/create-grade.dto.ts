import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateGradeDto {
  @ApiProperty({ example: 'Grade 10' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  level: number;

  @ApiPropertyOptional({ example: 'Sophomore year' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
