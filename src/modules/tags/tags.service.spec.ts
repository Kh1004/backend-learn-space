import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { PrismaService } from '../../database/prisma.service';

describe('TagsService', () => {
  let service: TagsService;

  const mockTag = {
    id: 'tag-1',
    name: 'Exam Prep',
    slug: 'exam-prep',
    usageCount: 5,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    tag: {
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
        TagsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  describe('findAll', () => {
    it('should return paginated tags', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([mockTag]);
      mockPrisma.tag.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: { deletedAt: null },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when tag not found', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a tag by ID', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue(mockTag);

      const result = await service.findOne('tag-1');

      expect(result.slug).toBe('exam-prep');
    });
  });

  describe('create', () => {
    it('should create a tag with slugified name', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue(mockTag);

      const result = await service.create({ name: 'Exam Prep' });

      expect(result.slug).toBe('exam-prep');
      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: { name: 'Exam Prep', slug: 'exam-prep' },
      });
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(mockTag);

      await expect(service.create({ name: 'Exam Prep' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      mockPrisma.tag.findFirst
        .mockResolvedValueOnce(mockTag)
        .mockResolvedValueOnce(null);
      mockPrisma.tag.update.mockResolvedValue({
        ...mockTag,
        name: 'Updated',
        slug: 'updated',
      });

      const result = await service.update('tag-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should soft-delete a tag', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue(mockTag);
      mockPrisma.tag.update.mockResolvedValue({
        ...mockTag,
        deletedAt: new Date(),
      });

      const result = await service.remove('tag-1');

      expect(result.message).toBe('Tag deleted successfully');
      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted tag', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue({
        ...mockTag,
        deletedAt: new Date(),
      });
      mockPrisma.tag.update.mockResolvedValue({
        ...mockTag,
        deletedAt: null,
      });

      const result = await service.restore('tag-1');

      expect(result.message).toBe('Tag restored successfully');
      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: 'tag-1' },
        data: { deletedAt: null },
      });
    });

  });
});
