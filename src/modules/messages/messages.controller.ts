import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MessagesService } from "./messages.service";
import { SendMessageDto, StartConversationDto } from "./dto";
import type { AuthenticatedRequest } from "../../common/interfaces";

@ApiTags("Messages")
@ApiBearerAuth()
@Controller("messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: "Get direct message threads for current user" })
  @ApiResponse({ status: 200, description: "List of message threads" })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.messagesService.findAllForUser(req.user.sub);
  }

  @Post("start")
  @ApiOperation({ summary: "Start or retrieve a conversation thread with a teacher" })
  @ApiResponse({ status: 201, description: "Conversation thread returned" })
  startThread(
    @Body() dto: StartConversationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.startThread(dto, req.user.sub);
  }

  @Post(":threadId")
  @ApiOperation({ summary: "Send a message in a thread" })
  @ApiParam({ name: "threadId", description: "Message Thread UUID" })
  @ApiResponse({ status: 201, description: "Updated thread with new message" })
  sendMessage(
    @Param("threadId") threadId: string,
    @Body() dto: SendMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.sendMessage(threadId, dto, req.user.sub);
  }
}
