import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateTeacherPostDto {
  @ApiProperty({ example: "New Trigonometry Past Paper 2024 solutions have been uploaded!" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: "Optional attached Material UUID" })
  @IsOptional()
  @IsString()
  attachedMaterialId?: string;
}
