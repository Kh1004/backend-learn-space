import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import {
  buildPaginatedResult,
  buildPrismaQueryOptions,
} from '../../common/utils';
import { buildSoftDeleteFilter } from '../../database/helpers';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from './dto';
import { Prisma, CommentType } from '@prisma/client';
import { ActivityEvent, ActivityType } from '../../common/events';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  private readonly commentSelect = {
    id: true,
    content: true,
    type: true,
    likeCount: true,
    isEdited: true,
    isPinned: true,
    createdAt: true,
    updatedAt: true,
    user: {
      select: { id: true, firstName: true, lastName: true },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByMaterial(materialId: string, query: CommentQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where = {
      materialId,
      parentId: null,
      ...softDeleteFilter,
    };

    const includeReplies = query.includeReplies !== false;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        select: {
          ...this.commentSelect,
          ...(includeReplies && {
            replies: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'asc' as const },
              select: this.commentSelect,
            },
          }),
        },
        skip,
        take,
        orderBy: [
          { isPinned: 'desc' as const },
          orderBy || { createdAt: 'desc' as const },
        ],
      }),
      this.prisma.comment.count({ where }),
    ]);

    return buildPaginatedResult(comments, query, total);
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...this.commentSelect,
        material: {
          select: { id: true, title: true, slug: true },
        },
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' as const },
          select: this.commentSelect,
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async create(dto: CreateCommentDto, userId: string) {
    const material = await this.prisma.material.findFirst({
      where: { id: dto.materialId, deletedAt: null },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });

      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parent.materialId !== dto.materialId) {
        throw new ForbiddenException(
          'Parent comment does not belong to this material',
        );
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        materialId: dto.materialId,
        userId,
        parentId: dto.parentId,
        content: dto.content,
        type: dto.parentId ? CommentType.REPLY : CommentType.ROOT,
      },
      select: this.commentSelect,
    });

    await this.prisma.material.update({
      where: { id: dto.materialId },
      data: { commentCount: { increment: 1 } },
    });

    this.logger.log(`Comment created by ${userId} on material ${dto.materialId}`);

    this.eventEmitter.emit(ActivityEvent.ACTION, new ActivityEvent(
      userId, ActivityType.COMMENT, 'material', dto.materialId,
    ));

    return comment;
  }

  async update(id: string, dto: UpdateCommentDto, userId: string, isAdmin: boolean) {
    const existing = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    if (existing.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const comment = await this.prisma.comment.update({
      where: { id },
      data: {
        content: dto.content,
        isEdited: true,
      },
      select: this.commentSelect,
    });

    this.logger.log(`Comment updated: ${id}`);
    return comment;
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const existing = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    if (existing.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.prisma.material.update({
      where: { id: existing.materialId },
      data: { commentCount: { decrement: 1 } },
    });

    this.logger.log(`Comment soft-deleted: ${id}`);
    return { message: 'Comment deleted successfully' };
  }

  async togglePin(id: string, isAdmin: boolean) {
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can pin comments');
    }

    const existing = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    const comment = await this.prisma.comment.update({
      where: { id },
      data: { isPinned: !existing.isPinned },
      select: this.commentSelect,
    });

    this.logger.log(`Comment ${comment.isPinned ? 'pinned' : 'unpinned'}: ${id}`);
    return comment;
  }

  async like(id: string) {
    const existing = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    const comment = await this.prisma.comment.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
      select: this.commentSelect,
    });

    return comment;
  }
}
