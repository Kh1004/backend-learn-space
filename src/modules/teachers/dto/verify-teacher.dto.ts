import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

export class VerifyTeacherDto {
  @ApiPropertyOptional({ example: "Verified", enum: ["Verified", "Rejected"] })
  @IsOptional()
  @IsString()
  @IsIn(["Verified", "Rejected"])
  decision?: "Verified" | "Rejected";
}
