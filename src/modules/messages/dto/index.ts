import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class StartConversationDto {
  @ApiProperty({ description: "Teacher User UUID" })
  @IsString()
  @IsNotEmpty()
  teacherId: string;
}

export class SendMessageDto {
  @ApiProperty({ example: "Hello sir, could you explain Question 4 from the Past Paper?" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}
