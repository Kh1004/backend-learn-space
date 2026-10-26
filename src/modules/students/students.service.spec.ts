import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { PrismaService } from '../../database/prisma.service';

describe('StudentsService', () => {
  let service: StudentsService;

  const mockProfile = {
    id: 'profile-1',
    gradeId: 'grade-1',
    institution: 'Central High',
    enrollmentYear: 2025,
    interests: ['Math'],
    readingGoal: 60,
    totalReadTime: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
    grade: { id: 'grade-1', name: 'Grade 10', slug: 'grade-10', level: 10 },
  };

  const mockPrisma = {
    studentProfile: {
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
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('findAll', () => {
    it('should return paginated profiles', async () => {
      mockPrisma.studentProfile.findMany.mockResolvedValue([mockProfile]);
      mockPrisma.studentProfile.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a profile by ID', async () => {
      mockPrisma.studentProfile.findFirst.mockResolvedValue(mockProfile);

      const result = await service.findOne('profile-1');

      expect(result.id).toBe('profile-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.studentProfile.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return a profile by userId', async () => {
      mockPrisma.studentProfile.findFirst.mockResolvedValue(mockProfile);

      const result = await service.findByUserId('user-1');

      expect(result.user.id).toBe('user-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.studentProfile.findFirst.mockResolvedValue(null);

      await expect(service.findByUserId('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      gradeId: 'grade-1',
      institution: 'Central High',
      enrollmentYear: 2025,
    };

    it('should create a new profile', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue(null);
      mockPrisma.studentProfile.create.mockResolvedValue(mockProfile);

      const result = await service.create(createDto, 'user-1');

      expect(result.id).toBe('profile-1');
      expect(mockPrisma.studentProfile.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue(mockProfile);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update own profile', async () => {
      mockPrisma.studentProfile.findFirst.mockResolvedValue(mockProfile);
      mockPrisma.studentProfile.update.mockResolvedValue({
        ...mockProfile,
        institution: 'New High',
      });

      const result = await service.update(
        'profile-1',
        { institution: 'New High' },
        'user-1',
        false,
      );

      expect(result.institution).toBe('New High');
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      mockPrisma.studentProfile.findFirst.mockResolvedValue(mockProfile);

      await expect(
        service.update('profile-1', { institution: 'New High' }, 'other-user', false),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete own profile', async () => {
      mockPrisma.studentProfile.findFirst.mockResolvedValue(mockProfile);
      mockPrisma.studentProfile.update.mockResolvedValue({
        ...mockProfile,
        deletedAt: new Date(),
      });

      const result = await service.remove('profile-1', 'user-1', false);

      expect(result.message).toBe('Student profile deleted successfully');
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      mockPrisma.studentProfile.findFirst.mockResolvedValue(mockProfile);

      await expect(
        service.remove('profile-1', 'other-user', false),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
