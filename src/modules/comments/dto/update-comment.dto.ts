import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
