import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { SendMessageDto, StartConversationDto } from "./dto";

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    return this.prisma.directMessageThread.findMany({
      where: {
        OR: [{ studentId: userId }, { teacherUserId: userId }],
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async startThread(dto: StartConversationDto, studentId: string) {
    const existing = await this.prisma.directMessageThread.findUnique({
      where: {
        studentId_teacherUserId: {
          studentId,
          teacherUserId: dto.teacherId,
        },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (existing) {
      return existing;
    }

    const thread = await this.prisma.directMessageThread.create({
      data: {
        studentId,
        teacherUserId: dto.teacherId,
        lastMessage: "Started a conversation",
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        messages: true,
      },
    });

    this.logger.log(`Direct message thread started: ${thread.id}`);
    return thread;
  }

  async sendMessage(threadId: string, dto: SendMessageDto, senderId: string) {
    const thread = await this.prisma.directMessageThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) {
      throw new NotFoundException("Message thread not found");
    }

    await this.prisma.directMessage.create({
      data: {
        threadId,
        senderId,
        text: dto.text,
      },
    });

    return this.prisma.directMessageThread.update({
      where: { id: threadId },
      data: {
        lastMessage: dto.text,
        updatedAt: new Date(),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }
}
