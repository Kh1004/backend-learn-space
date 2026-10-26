import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { PrismaService } from '../../database/prisma.service';

describe('SubjectsService', () => {
  let service: SubjectsService;

  const mockSubject = {
    id: 'subject-1',
    name: 'Mathematics',
    slug: 'mathematics',
    description: 'Algebra, calculus, statistics and more',
    sortOrder: 1,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    subject: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockPrisma.subject.findMany.mockResolvedValue([mockSubject]);
      mockPrisma.subject.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a subject by ID', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(mockSubject);

      const result = await service.findOne('subject-1');

      expect(result.name).toBe('Mathematics');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a subject by slug', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(mockSubject);

      const result = await service.findBySlug('mathematics');

      expect(result.slug).toBe('mathematics');
    });

    it('should throw NotFoundException if slug not found', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new subject with slugified name', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(null);
      mockPrisma.subject.create.mockResolvedValue(mockSubject);

      const result = await service.create({
        name: 'Mathematics',
        description: 'Algebra and calculus',
      });

      expect(result.name).toBe('Mathematics');
      expect(result.slug).toBe('mathematics');
    });

    it('should throw ConflictException for duplicate slug', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(mockSubject);

      await expect(
        service.create({ name: 'Mathematics', description: 'test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update subject fields', async () => {
      mockPrisma.subject.findFirst
        .mockResolvedValueOnce(mockSubject)
        .mockResolvedValueOnce(null);
      mockPrisma.subject.update.mockResolvedValue({
        ...mockSubject,
        name: 'Physics',
        slug: 'physics',
      });

      const result = await service.update('subject-1', { name: 'Physics' });

      expect(result.name).toBe('Physics');
    });

    it('should throw NotFoundException for nonexistent subject', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate slug', async () => {
      mockPrisma.subject.findFirst
        .mockResolvedValueOnce(mockSubject)
        .mockResolvedValueOnce({ id: 'other', slug: 'physics' });

      await expect(
        service.update('subject-1', { name: 'Physics' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a subject', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(mockSubject);
      mockPrisma.subject.update.mockResolvedValue({
        ...mockSubject,
        deletedAt: new Date(),
      });

      const result = await service.remove('subject-1');

      expect(result.message).toBe('Subject deleted successfully');
      expect(mockPrisma.subject.update).toHaveBeenCalledWith({
        where: { id: 'subject-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted subject', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue({
        ...mockSubject,
        deletedAt: new Date(),
      });
      mockPrisma.subject.update.mockResolvedValue({
        ...mockSubject,
        deletedAt: null,
      });

      const result = await service.restore('subject-1');

      expect(result.message).toBe('Subject restored successfully');
      expect(mockPrisma.subject.update).toHaveBeenCalledWith({
        where: { id: 'subject-1' },
        data: { deletedAt: null },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(null);

      await expect(service.restore('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
