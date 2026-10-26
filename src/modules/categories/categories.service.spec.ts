import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../database/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategory = {
    id: 'cat-1',
    name: 'Past Papers',
    slug: 'past-papers',
    description: 'Previous exam papers',
    parentId: null,
    sortOrder: 1,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChild = {
    id: 'cat-2',
    name: 'Math Papers',
    slug: 'math-papers',
    description: null,
    parentId: 'cat-1',
    sortOrder: 1,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);
      mockPrisma.category.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findTree', () => {
    it('should return hierarchical categories with nested children', async () => {
      const tree = [{ ...mockCategory, children: [mockChild] }];
      mockPrisma.category.findMany.mockResolvedValue(tree);

      const result = await service.findTree();

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].parentId).toBe('cat-1');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a category with parent and _count', async () => {
      const withRelations = {
        ...mockCategory,
        parent: null,
        _count: { materials: 5, children: 2 },
      };
      mockPrisma.category.findFirst.mockResolvedValue(withRelations);

      const result = await service.findOne('cat-1');

      expect(result._count.materials).toBe(5);
      expect(result._count.children).toBe(2);
    });
  });

  describe('create', () => {
    it('should create a category successfully', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.create({
        name: 'Past Papers',
        description: 'Previous exam papers',
      });

      expect(result.name).toBe('Past Papers');
      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'past-papers' }),
        }),
      );
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      await expect(
        service.create({ name: 'Past Papers' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if parent not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ name: 'New Category', parentId: 'nonexistent' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException if category has children', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.count.mockResolvedValue(3);

      await expect(service.remove('cat-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted category', async () => {
      const deleted = { ...mockCategory, deletedAt: new Date() };
      mockPrisma.category.findFirst.mockResolvedValue(deleted);
      mockPrisma.category.update.mockResolvedValue({ ...mockCategory, deletedAt: null });

      const result = await service.restore('cat-1');

      expect(result.message).toBe('Category restored successfully');
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { deletedAt: null },
      });
    });

    it('should throw NotFoundException if deleted category not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.restore('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
