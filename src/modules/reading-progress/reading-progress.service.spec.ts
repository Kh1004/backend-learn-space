import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReadingProgressService } from './reading-progress.service';
import { PrismaService } from '../../database/prisma.service';

describe('ReadingProgressService', () => {
  let service: ReadingProgressService;

  const userId = 'user-1';
  const materialId = 'mat-1';

  const mockProgress = {
    id: 'rp-1',
    currentPage: 10,
    progressPercent: 50,
    readingTime: 120,
    isCompleted: false,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    material: {
      id: materialId,
      title: 'Test Material',
      slug: 'test-material',
      type: 'ARTICLE',
      readingTime: 5,
    },
  };

  const mockPrisma = {
    readingProgress: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    material: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingProgressService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReadingProgressService>(ReadingProgressService);
  });

  describe('findByUser', () => {
    it('should return paginated progress for a user', async () => {
      mockPrisma.readingProgress.findMany.mockResolvedValue([mockProgress]);
      mockPrisma.readingProgress.count.mockResolvedValue(1);

      const result = await service.findByUser(userId, { page: 1, limit: 10 } as never);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findByMaterial', () => {
    it('should return progress if found', async () => {
      mockPrisma.readingProgress.findUnique.mockResolvedValue(mockProgress);

      const result = await service.findByMaterial(userId, materialId);

      expect(result).toEqual(mockProgress);
    });

    it('should return null if no progress found', async () => {
      mockPrisma.readingProgress.findUnique.mockResolvedValue(null);

      const result = await service.findByMaterial(userId, materialId);

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    const dto = { materialId, currentPage: 10, progressPercent: 75, readingTime: 60 };

    it('should create new progress', async () => {
      mockPrisma.material.findFirst.mockResolvedValue({ id: materialId });
      mockPrisma.readingProgress.upsert.mockResolvedValue({
        ...mockProgress,
        progressPercent: 75,
      });

      const result = await service.upsert(userId, dto as never);

      expect(result.progressPercent).toBe(75);
      expect(mockPrisma.readingProgress.upsert).toHaveBeenCalled();
    });

    it('should update existing progress', async () => {
      mockPrisma.material.findFirst.mockResolvedValue({ id: materialId });
      mockPrisma.readingProgress.upsert.mockResolvedValue({
        ...mockProgress,
        progressPercent: 100,
        isCompleted: true,
      });

      const result = await service.upsert(userId, { ...dto, progressPercent: 100 } as never);

      expect(result.isCompleted).toBe(true);
    });

    it('should throw NotFoundException if material not found', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(null);

      await expect(service.upsert(userId, dto as never)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete progress and return message', async () => {
      mockPrisma.readingProgress.findUnique.mockResolvedValue({ id: 'rp-1' });
      mockPrisma.readingProgress.delete.mockResolvedValue({});

      const result = await service.remove(userId, materialId);

      expect(result.message).toBe('Reading progress deleted successfully');
      expect(mockPrisma.readingProgress.delete).toHaveBeenCalledWith({
        where: { id: 'rp-1' },
      });
    });

    it('should throw NotFoundException if progress not found', async () => {
      mockPrisma.readingProgress.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, materialId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
