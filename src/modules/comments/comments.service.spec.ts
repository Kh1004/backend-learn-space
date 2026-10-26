import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../database/prisma.service';
import { CommentType } from '@prisma/client';

describe('CommentsService', () => {
  let service: CommentsService;

  const userId = 'user-1';
  const commentId = 'comment-1';
  const materialId = 'mat-1';

  const mockComment = {
    id: commentId,
    content: 'Test comment',
    type: CommentType.ROOT,
    likeCount: 0,
    isEdited: false,
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
    materialId,
    parentId: null,
    user: { id: userId, firstName: 'John', lastName: 'Doe' },
  };

  const mockPrisma = {
    comment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    material: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  describe('findByMaterial', () => {
    it('should return paginated comments', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([mockComment]);
      mockPrisma.comment.count.mockResolvedValue(1);

      const result = await service.findByMaterial(materialId, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a comment by id', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);

      const result = await service.findOne(commentId);

      expect(result.id).toBe(commentId);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      materialId,
      content: 'New comment',
    };

    it('should create a root comment', async () => {
      mockPrisma.material.findFirst.mockResolvedValue({ id: materialId });
      mockPrisma.comment.create.mockResolvedValue(mockComment);
      mockPrisma.material.update.mockResolvedValue({});

      const result = await service.create(createDto, userId);

      expect(result).toBeDefined();
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: CommentType.ROOT }),
        }),
      );
      expect(mockPrisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { commentCount: { increment: 1 } },
        }),
      );
    });

    it('should create a reply comment', async () => {
      const parentComment = { ...mockComment, id: 'parent-1' };
      mockPrisma.material.findFirst.mockResolvedValue({ id: materialId });
      mockPrisma.comment.findFirst.mockResolvedValue(parentComment);
      mockPrisma.comment.create.mockResolvedValue({
        ...mockComment,
        type: CommentType.REPLY,
        parentId: 'parent-1',
      });
      mockPrisma.material.update.mockResolvedValue({});

      const result = await service.create(
        { ...createDto, parentId: 'parent-1' },
        userId,
      );

      expect(result.type).toBe(CommentType.REPLY);
    });

    it('should throw NotFoundException if material not found', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if parent not found', async () => {
      mockPrisma.material.findFirst.mockResolvedValue({ id: materialId });
      mockPrisma.comment.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, parentId: 'parent-1' }, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if parent belongs to different material', async () => {
      const parentComment = { ...mockComment, materialId: 'mat-2' };
      mockPrisma.material.findFirst.mockResolvedValue({ id: materialId });
      mockPrisma.comment.findFirst.mockResolvedValue(parentComment);

      await expect(
        service.create({ ...createDto, parentId: 'parent-1' }, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({
        ...mockComment,
        content: 'Updated',
        isEdited: true,
      });

      const result = await service.update(
        commentId,
        { content: 'Updated' },
        userId,
        false,
      );

      expect(result.content).toBe('Updated');
      expect(result.isEdited).toBe(true);
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);

      await expect(
        service.update(commentId, { content: 'Updated' }, 'other-user', false),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a comment', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({});
      mockPrisma.material.update.mockResolvedValue({});

      const result = await service.remove(commentId, userId, false);

      expect(result.message).toBe('Comment deleted successfully');
      expect(mockPrisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { commentCount: { decrement: 1 } },
        }),
      );
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);

      await expect(
        service.remove(commentId, 'other-user', false),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('togglePin', () => {
    it('should toggle pin status', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({
        ...mockComment,
        isPinned: true,
      });

      const result = await service.togglePin(commentId, true);

      expect(result.isPinned).toBe(true);
    });

    it('should throw ForbiddenException if not admin', async () => {
      await expect(service.togglePin(commentId, false)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('like', () => {
    it('should increment likeCount', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({
        ...mockComment,
        likeCount: 1,
      });

      const result = await service.like(commentId);

      expect(result.likeCount).toBe(1);
      expect(mockPrisma.comment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { likeCount: { increment: 1 } },
        }),
      );
    });
  });
});
