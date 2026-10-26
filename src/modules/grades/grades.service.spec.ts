import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { GradesService } from './grades.service';
import { PrismaService } from '../../database/prisma.service';

describe('GradesService', () => {
  let service: GradesService;

  const mockGrade = {
    id: 'grade-1',
    name: 'Grade 10',
    slug: 'grade-10',
    level: 10,
    description: 'Sophomore year',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    grade: {
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
        GradesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  describe('findAll', () => {
    it('should return paginated grades', async () => {
      mockPrisma.grade.findMany.mockResolvedValue([mockGrade]);
      mockPrisma.grade.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a grade by ID', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue(mockGrade);

      const result = await service.findOne('grade-1');

      expect(result.slug).toBe('grade-10');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Grade 10',
      level: 10,
      description: 'Sophomore year',
    };

    it('should create a new grade', async () => {
      mockPrisma.grade.findUnique.mockResolvedValue(null);
      mockPrisma.grade.create.mockResolvedValue(mockGrade);

      const result = await service.create(createDto);

      expect(result.name).toBe('Grade 10');
      expect(mockPrisma.grade.create).toHaveBeenCalledWith({
        data: {
          name: 'Grade 10',
          slug: 'grade-10',
          level: 10,
          description: 'Sophomore year',
        },
      });
    });

    it('should throw ConflictException for duplicate slug', async () => {
      mockPrisma.grade.findUnique.mockResolvedValue(mockGrade);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException for duplicate level', async () => {
      mockPrisma.grade.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockGrade);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing grade', async () => {
      mockPrisma.grade.findFirst
        .mockResolvedValueOnce(mockGrade)
        .mockResolvedValueOnce(null);
      mockPrisma.grade.update.mockResolvedValue({
        ...mockGrade,
        name: 'Grade 11',
      });

      const result = await service.update('grade-1', { name: 'Grade 11' });

      expect(result.name).toBe('Grade 11');
    });

    it('should throw ConflictException for duplicate name on update', async () => {
      mockPrisma.grade.findFirst
        .mockResolvedValueOnce(mockGrade)
        .mockResolvedValueOnce({ ...mockGrade, id: 'other-grade' });

      await expect(
        service.update('grade-1', { name: 'Grade 10' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a grade', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue(mockGrade);
      mockPrisma.grade.update.mockResolvedValue({
        ...mockGrade,
        deletedAt: new Date(),
      });

      const result = await service.remove('grade-1');

      expect(result.message).toBe('Grade deleted successfully');
      expect(mockPrisma.grade.update).toHaveBeenCalledWith({
        where: { id: 'grade-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted grade', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue({
        ...mockGrade,
        deletedAt: new Date(),
      });
      mockPrisma.grade.update.mockResolvedValue({
        ...mockGrade,
        deletedAt: null,
      });

      const result = await service.restore('grade-1');

      expect(result.message).toBe('Grade restored successfully');
    });

    it('should throw NotFoundException if deleted grade not found', async () => {
      mockPrisma.grade.findFirst.mockResolvedValue(null);

      await expect(service.restore('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
