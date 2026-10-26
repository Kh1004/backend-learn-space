import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MaterialsService } from './materials.service';
import { PrismaService } from '../../database/prisma.service';
import { MaterialStatus } from '@prisma/client';

describe('MaterialsService', () => {
  let service: MaterialsService;

  const userId = 'user-1';
  const materialId = 'mat-1';

  const mockMaterial = {
    id: materialId,
    title: 'Test Material',
    slug: 'test-material',
    description: 'A test material',
    type: 'ARTICLE',
    status: MaterialStatus.DRAFT,
    visibility: 'PUBLIC',
    language: 'en',
    viewCount: 0,
    downloadCount: 0,
    bookmarkCount: 0,
    likeCount: 0,
    commentCount: 0,
    readingTime: 5,
    publishedAt: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: userId,
    author: { id: userId, firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
    category: { id: 'cat-1', name: 'Science', slug: 'science' },
    subjects: [],
    grades: [],
    tags: [],
    files: [],
  };

  const mockTx = {
    material: {
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    materialSubject: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    materialGrade: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    materialTag: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  const mockPrisma = {
    material: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<unknown>) => {
      return cb(mockTx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  describe('findAll', () => {
    it('should return paginated materials', async () => {
      mockPrisma.material.findMany.mockResolvedValue([mockMaterial]);
      mockPrisma.material.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 } as never);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a material by id', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(mockMaterial);

      const result = await service.findOne(materialId);

      expect(result.id).toBe(materialId);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      title: 'New Material',
      description: 'Desc',
      type: 'ARTICLE' as const,
      visibility: 'PUBLIC' as const,
      language: 'en',
    };

    it('should create a material with slugified title', async () => {
      mockPrisma.material.findUnique.mockResolvedValue(null);
      mockPrisma.material.create.mockResolvedValue(mockMaterial);

      const result = await service.create(createDto as never, userId);

      expect(result).toBeDefined();
      expect(mockPrisma.material.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Material',
            slug: 'new-material',
          }),
        }),
      );
    });

    it('should throw ForbiddenException if slug already exists', async () => {
      mockPrisma.material.findUnique.mockResolvedValue(mockMaterial);

      await expect(service.create(createDto as never, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a material via transaction', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(mockMaterial);
      mockTx.material.update.mockResolvedValue(mockMaterial);
      mockTx.material.findFirst.mockResolvedValue(mockMaterial);

      const result = await service.update(materialId, { title: 'Updated' } as never, userId);

      expect(result.id).toBe(materialId);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if material not found', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'Updated' } as never, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.material.findFirst.mockResolvedValue({
        ...mockMaterial,
        authorId: 'other-user',
      });

      await expect(
        service.update(materialId, { title: 'Updated' } as never, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a material', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(mockMaterial);
      mockPrisma.material.update.mockResolvedValue(mockMaterial);

      const result = await service.remove(materialId, userId);

      expect(result.message).toBe('Material deleted successfully');
      expect(mockPrisma.material.update).toHaveBeenCalledWith({
        where: { id: materialId },
        data: { deletedAt: expect.any(Date), status: MaterialStatus.ARCHIVED },
      });
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.material.findFirst.mockResolvedValue({
        ...mockMaterial,
        authorId: 'other-user',
      });

      await expect(service.remove(materialId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted material', async () => {
      mockPrisma.material.findFirst.mockResolvedValue({
        ...mockMaterial,
        deletedAt: new Date(),
      });
      mockPrisma.material.update.mockResolvedValue(mockMaterial);

      const result = await service.restore(materialId, userId);

      expect(result.message).toBe('Material restored successfully');
    });

    it('should throw NotFoundException if deleted material not found', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(null);

      await expect(service.restore('nonexistent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('publish', () => {
    it('should delegate to update with PUBLISHED status', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(mockMaterial);
      mockTx.material.update.mockResolvedValue({
        ...mockMaterial,
        status: MaterialStatus.PUBLISHED,
      });
      mockTx.material.findFirst.mockResolvedValue({
        ...mockMaterial,
        status: MaterialStatus.PUBLISHED,
      });

      const result = await service.publish(materialId, userId);

      expect(result.status).toBe(MaterialStatus.PUBLISHED);
    });
  });
});
