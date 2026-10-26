import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LikesService } from './likes.service';
import { PrismaService } from '../../database/prisma.service';

describe('LikesService', () => {
  let service: LikesService;

  const userId = 'user-1';
  const materialId = 'mat-1';

  const mockLike = {
    id: 'like-1',
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
    materialLike: {
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

  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  describe('toggle', () => {
    it('should add a like when none exists', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(mockMaterial);
      mockPrisma.materialLike.findUnique.mockResolvedValue(null);
      mockPrisma.materialLike.create.mockResolvedValue(mockLike);
      mockPrisma.material.update.mockResolvedValue({});

      const result = await service.toggle(userId, materialId);

      expect(result).toEqual({ liked: true });
      expect(mockPrisma.materialLike.create).toHaveBeenCalled();
      expect(mockPrisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ likeCount: { increment: 1 } }),
        }),
      );
    });

    it('should remove like when it already exists', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(mockMaterial);
      mockPrisma.materialLike.findUnique.mockResolvedValue({ id: 'like-1' });
      mockPrisma.materialLike.delete.mockResolvedValue({});
      mockPrisma.material.update.mockResolvedValue({});

      const result = await service.toggle(userId, materialId);

      expect(result).toEqual({ liked: false });
      expect(mockPrisma.materialLike.delete).toHaveBeenCalled();
      expect(mockPrisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ likeCount: { decrement: 1 } }),
        }),
      );
    });

    it('should throw NotFoundException when material not found', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(null);

      await expect(service.toggle(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('check', () => {
    it('should return liked: true when user has liked', async () => {
      mockPrisma.materialLike.findUnique.mockResolvedValue(mockLike);

      const result = await service.check(userId, materialId);
      expect(result).toEqual({ liked: true });
    });

    it('should return liked: false when user has not liked', async () => {
      mockPrisma.materialLike.findUnique.mockResolvedValue(null);

      const result = await service.check(userId, materialId);
      expect(result).toEqual({ liked: false });
    });
  });

  describe('findByUser', () => {
    it('should return paginated likes', async () => {
      mockPrisma.materialLike.findMany.mockResolvedValue([mockLike]);
      mockPrisma.materialLike.count.mockResolvedValue(1);

      const result = await service.findByUser(userId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findByMaterial', () => {
    it('should return paginated likes for a material', async () => {
      mockPrisma.materialLike.findMany.mockResolvedValue([mockLike]);
      mockPrisma.materialLike.count.mockResolvedValue(1);

      const result = await service.findByMaterial(materialId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
