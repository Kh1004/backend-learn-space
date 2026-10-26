import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class ModerateMaterialDto {
  @ApiProperty({ example: "Approved", enum: ["Approved", "Under Review", "Removed"] })
  @IsString()
  @IsNotEmpty()
  @IsIn(["Approved", "Under Review", "Removed"])
  status: "Approved" | "Under Review" | "Removed";
}
