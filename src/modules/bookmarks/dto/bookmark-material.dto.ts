import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class BookmarkMaterialDto {
  @ApiProperty({ description: 'Material UUID to bookmark' })
  @IsUUID()
  @IsNotEmpty()
  materialId: string;
}
