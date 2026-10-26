import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookmarksService } from './bookmarks.service';
import { PrismaService } from '../../database/prisma.service';

describe('BookmarksService', () => {
  let service: BookmarksService;

  const userId = 'user-1';
  const materialId = 'mat-1';

  const mockBookmark = {
    id: 'bm-1',
    createdAt: new Date(),
    materialId,
    userId,
  };

  const mockMaterial = {
    id: materialId,
    title: 'Test Material',
    slug: 'test-material',
  };

  const mockPrisma = {
    materialBookmark: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
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
        BookmarksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  describe('findByUser', () => {
    it('should return paginated bookmarks', async () => {
      mockPrisma.materialBookmark.findMany.mockResolvedValue([mockBookmark]);
      mockPrisma.materialBookmark.count.mockResolvedValue(1);

      const result = await service.findByUser(userId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('toggle', () => {
    it('should add bookmark when none exists', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(mockMaterial);
      mockPrisma.materialBookmark.findUnique.mockResolvedValue(null);
      mockPrisma.materialBookmark.create.mockResolvedValue(mockBookmark);
      mockPrisma.material.update.mockResolvedValue({});

      const result = await service.toggle(userId, materialId);

      expect(result).toEqual({ bookmarked: true });
      expect(mockPrisma.materialBookmark.create).toHaveBeenCalled();
      expect(mockPrisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bookmarkCount: { increment: 1 } },
        }),
      );
    });

    it('should remove bookmark when one exists', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(mockMaterial);
      mockPrisma.materialBookmark.findUnique.mockResolvedValue(mockBookmark);
      mockPrisma.materialBookmark.delete.mockResolvedValue({});
      mockPrisma.material.update.mockResolvedValue({});

      const result = await service.toggle(userId, materialId);

      expect(result).toEqual({ bookmarked: false });
      expect(mockPrisma.materialBookmark.delete).toHaveBeenCalled();
      expect(mockPrisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bookmarkCount: { decrement: 1 } },
        }),
      );
    });

    it('should throw NotFoundException if material not found', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(null);

      await expect(service.toggle(userId, materialId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('check', () => {
    it('should return bookmarked true when bookmark exists', async () => {
      mockPrisma.materialBookmark.findUnique.mockResolvedValue(mockBookmark);

      const result = await service.check(userId, materialId);

      expect(result).toEqual({ bookmarked: true });
    });

    it('should return bookmarked false when no bookmark exists', async () => {
      mockPrisma.materialBookmark.findUnique.mockResolvedValue(null);

      const result = await service.check(userId, materialId);

      expect(result).toEqual({ bookmarked: false });
    });
  });
});
