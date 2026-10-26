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
import {
  buildSearchFilter,
  buildSoftDeleteFilter,
} from '../../database/helpers';
import { CreateMaterialDto, UpdateMaterialDto, MaterialQueryDto } from './dto';
import { Prisma, MaterialStatus, MaterialVisibility } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/interfaces';
import {
  MaterialPublishedEvent,
  MaterialArchivedEvent,
} from '../../common/events';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  private readonly materialSelect = {
    id: true,
    title: true,
    slug: true,
    description: true,
    type: true,
    status: true,
    visibility: true,
    language: true,
    viewCount: true,
    downloadCount: true,
    bookmarkCount: true,
    likeCount: true,
    commentCount: true,
    readingTime: true,
    publishedAt: true,
    moderationStatus: true,
    metadata: true,
    allowedStudents: {
      select: { studentId: true },
    },
    createdAt: true,
    updatedAt: true,
    author: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
    category: {
      select: { id: true, name: true, slug: true },
    },
    subjects: {
      select: {
        subject: { select: { id: true, name: true, slug: true } },
      },
    },
    grades: {
      select: {
        grade: { select: { id: true, name: true, slug: true, level: true } },
      },
    },
    tags: {
      select: {
        tag: { select: { id: true, name: true, slug: true } },
      },
    },
    files: {
      select: {
        file: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            url: true,
          },
        },
        isPrimary: true,
        sortOrder: true,
        label: true,
      },
      orderBy: { sortOrder: 'asc' as const },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: MaterialQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const searchFilter = buildSearchFilter(query.search, [
      'title',
      'description',
    ]);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where: Prisma.MaterialWhereInput = {
      ...softDeleteFilter,
      ...searchFilter,
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.visibility && { visibility: query.visibility }),
      ...(query.authorId && { authorId: query.authorId }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.subjectId && {
        subjects: { some: { subjectId: query.subjectId } },
      }),
      ...(query.gradeId && {
        grades: { some: { gradeId: query.gradeId } },
      }),
      ...(query.tagSlug && {
        tags: { some: { tag: { slug: query.tagSlug } } },
      }),
    };

    const [materials, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        select: this.materialSelect,
        skip,
        take,
        orderBy,
      }),
      this.prisma.material.count({ where }),
    ]);

    return buildPaginatedResult(materials, query, total);
  }

  async findPublished(query: MaterialQueryDto) {
    return this.findAll({ ...query, status: MaterialStatus.PUBLISHED });
  }

  async findOne(id: string) {
    const material = await this.prisma.material.findFirst({
      where: { id, deletedAt: null },
      select: this.materialSelect,
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async findBySlug(slug: string) {
    const material = await this.prisma.material.findFirst({
      where: { slug, deletedAt: null },
      select: this.materialSelect,
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async create(dto: CreateMaterialDto, authorId: string) {
    const slug = this.slugify(dto.title);

    const existing = await this.prisma.material.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ForbiddenException(
        'A material with this title already exists',
      );
    }

    const material = await this.prisma.material.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        content: dto.content,
        type: dto.type,
        visibility: dto.visibility,
        language: dto.language,
        authorId,
        categoryId: dto.categoryId,
        thumbnailId: dto.thumbnailId,
        readingTime: dto.readingTime,
        metadata: dto.metadata as Prisma.InputJsonValue,
        ...(dto.subjectIds?.length && {
          subjects: {
            create: dto.subjectIds.map((subjectId) => ({ subjectId })),
          },
        }),
        ...(dto.gradeIds?.length && {
          grades: {
            create: dto.gradeIds.map((gradeId) => ({ gradeId })),
          },
        }),
        ...(dto.tagIds?.length && {
          tags: {
            create: dto.tagIds.map((tagId) => ({ tagId })),
          },
        }),
        ...(dto.allowedStudentIds?.length && {
          allowedStudents: {
            create: dto.allowedStudentIds.map((studentId) => ({
              studentId,
              grantedBy: authorId,
            })),
          },
        }),
        ...(dto.fileIds?.length && {
          files: {
            create: dto.fileIds.map((fileId, index) => ({
              fileId,
              isPrimary: index === 0,
              sortOrder: index,
            })),
          },
        }),
      },
      select: this.materialSelect,
    });

    this.logger.log(`Material created: ${material.title} by ${authorId}`);
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto, userId: string) {
    const existing = await this.prisma.material.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Material not found');
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own materials');
    }

    const updateData: Prisma.MaterialUpdateInput = {
      ...(dto.title && { title: dto.title, slug: this.slugify(dto.title) }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.type && { type: dto.type }),
      ...(dto.status && { status: dto.status }),
      ...(dto.visibility && { visibility: dto.visibility }),
      ...(dto.language !== undefined && { language: dto.language }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.thumbnailId !== undefined && { thumbnailId: dto.thumbnailId }),
      ...(dto.readingTime !== undefined && { readingTime: dto.readingTime }),
      ...(dto.metadata !== undefined && {
        metadata: dto.metadata as Prisma.InputJsonValue,
      }),
      ...(dto.status === MaterialStatus.PUBLISHED &&
        !existing.publishedAt && { publishedAt: new Date() }),
    };

    // Handle junction table updates in a transaction
    const material = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.material.update({
        where: { id },
        data: updateData,
        select: this.materialSelect,
      });

      if (dto.subjectIds) {
        await tx.materialSubject.deleteMany({ where: { materialId: id } });
        if (dto.subjectIds.length > 0) {
          await tx.materialSubject.createMany({
            data: dto.subjectIds.map((subjectId) => ({
              materialId: id,
              subjectId,
            })),
          });
        }
      }

      if (dto.gradeIds) {
        await tx.materialGrade.deleteMany({ where: { materialId: id } });
        if (dto.gradeIds.length > 0) {
          await tx.materialGrade.createMany({
            data: dto.gradeIds.map((gradeId) => ({
              materialId: id,
              gradeId,
            })),
          });
        }
      }

      if (dto.tagIds) {
        await tx.materialTag.deleteMany({ where: { materialId: id } });
        if (dto.tagIds.length > 0) {
          await tx.materialTag.createMany({
            data: dto.tagIds.map((tagId) => ({
              materialId: id,
              tagId,
            })),
          });
        }
      }

      if (dto.allowedStudentIds) {
        await tx.materialAllowedStudent.deleteMany({ where: { materialId: id } });
        if (dto.allowedStudentIds.length > 0) {
          await tx.materialAllowedStudent.createMany({
            data: dto.allowedStudentIds.map((studentId) => ({
              materialId: id,
              studentId,
              grantedBy: userId,
            })),
          });
        }
      }

      // Re-fetch with relations
      return tx.material.findFirst({
        where: { id },
        select: this.materialSelect,
      });
    });

    this.logger.log(`Material updated: ${material!.title}`);
    return material;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.material.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Material not found');
    }

    if (existing.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own materials');
    }

    await this.prisma.material.update({
      where: { id },
      data: { deletedAt: new Date(), status: MaterialStatus.ARCHIVED },
    });

    this.logger.log(`Material soft-deleted: ${id}`);
    return { message: 'Material deleted successfully' };
  }

  async restore(id: string, userId: string) {
    const material = await this.prisma.material.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!material) {
      throw new NotFoundException('Deleted material not found');
    }

    if (material.authorId !== userId) {
      throw new ForbiddenException(
        'You can only restore your own materials',
      );
    }

    await this.prisma.material.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`Material restored: ${id}`);
    return { message: 'Material restored successfully' };
  }

  async publish(id: string, userId: string) {
    const material = await this.update(
      id,
      { status: MaterialStatus.PUBLISHED },
      userId,
    );

    this.eventEmitter.emit(
      MaterialPublishedEvent.ACTION,
      new MaterialPublishedEvent(
        userId,
        material!.id,
        material!.title,
        material!.subjects?.[0]?.subject?.id ?? '',
        material!.grades?.[0]?.grade?.id ?? '',
      ),
    );

    return material;
  }

  async archive(id: string, userId: string) {
    const material = await this.update(
      id,
      { status: MaterialStatus.ARCHIVED },
      userId,
    );

    this.eventEmitter.emit(
      MaterialArchivedEvent.ACTION,
      new MaterialArchivedEvent(userId, material!.id),
    );

    return material;
  }

  async recordDownload(id: string, userId?: string) {
    const material = await this.prisma.material.findFirst({
      where: { id, deletedAt: null },
      include: {
        allowedStudents: { select: { studentId: true } },
      },
    });
    if (!material) {
      throw new NotFoundException("Material not found");
    }

    // Enforce Followers-Only access
    if (
      material.visibility === MaterialVisibility.FOLLOWERS &&
      material.authorId !== userId
    ) {
      if (!userId) {
        throw new ForbiddenException("Follow this teacher to download Followers-Only materials");
      }
      const isFollowing = await this.prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: material.authorId,
          },
        },
      });
      if (!isFollowing) {
        throw new ForbiddenException("Follow this teacher to download Followers-Only materials");
      }
    }

    // Enforce Restricted (GROUP) student allow-list access
    if (
      material.visibility === MaterialVisibility.GROUP &&
      material.authorId !== userId
    ) {
      const allowedIds = material.allowedStudents.map((s) => s.studentId);
      if (!userId || !allowedIds.includes(userId)) {
        throw new ForbiddenException("This material is restricted to selected students only");
      }
    }

    const updated = await this.prisma.material.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
      select: this.materialSelect,
    });

    await this.prisma.teacherProfile.updateMany({
      where: { userId: material.authorId },
      data: { totalDownloads: { increment: 1 } },
    });

    this.logger.log(`Material downloaded: ${id} by ${userId ?? "anonymous"}`);
    return updated;
  }

  async moderate(
    id: string,
    status: "Approved" | "Under Review" | "Removed",
    moderatorId: string,
  ) {
    const existing = await this.prisma.material.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException("Material not found");
    }

    if (status === "Removed") {
      await this.prisma.material.update({
        where: { id },
        data: {
          moderationStatus: "Removed",
          status: MaterialStatus.ARCHIVED,
          deletedAt: new Date(),
          updatedBy: moderatorId,
        },
      });
      this.logger.log(`Material removed by moderator ${moderatorId}: ${id}`);
      return { id, removed: true };
    }

    const updated = await this.prisma.material.update({
      where: { id },
      data: {
        moderationStatus: status,
        updatedBy: moderatorId,
      },
      select: this.materialSelect,
    });
    this.logger.log(`Material ${id} moderation status set to ${status} by ${moderatorId}`);
    return updated;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 200);
  }
}
