import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { PrismaService } from '../../database/prisma.service';

describe('TeachersService', () => {
  let service: TeachersService;

  const mockProfile = {
    id: 'profile-1',
    bio: 'Test bio',
    institution: 'Test University',
    expertise: ['Math'],
    qualification: 'Ph.D.',
    yearsOfExperience: 10,
    website: null,
    socialLinks: null,
    isVerified: false,
    verifiedAt: null,
    followerCount: 0,
    materialCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
  };

  const mockPrisma = {
    teacherProfile: {
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
        TeachersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
  });

  describe('findAll', () => {
    it('should return paginated teacher profiles', async () => {
      mockPrisma.teacherProfile.findMany.mockResolvedValue([mockProfile]);
      mockPrisma.teacherProfile.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a teacher profile by id', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(mockProfile);

      const result = await service.findOne('profile-1');

      expect(result.id).toBe('profile-1');
      expect(result.user.id).toBe('user-1');
    });
  });

  describe('findByUserId', () => {
    it('should throw NotFoundException if not found', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(null);

      await expect(service.findByUserId('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a teacher profile by userId', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(mockProfile);

      const result = await service.findByUserId('user-1');

      expect(result.user.id).toBe('user-1');
    });
  });

  describe('create', () => {
    const createDto = {
      bio: 'New bio',
      institution: 'New University',
      expertise: ['Physics'],
    };

    it('should create a new teacher profile', async () => {
      mockPrisma.teacherProfile.findUnique.mockResolvedValue(null);
      mockPrisma.teacherProfile.create.mockResolvedValue(mockProfile);

      const result = await service.create(createDto, 'user-1');

      expect(result.id).toBe('profile-1');
      expect(mockPrisma.teacherProfile.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockPrisma.teacherProfile.findUnique.mockResolvedValue(mockProfile);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a teacher profile', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(mockProfile);
      mockPrisma.teacherProfile.update.mockResolvedValue({
        ...mockProfile,
        bio: 'Updated bio',
      });

      const result = await service.update(
        'profile-1',
        { bio: 'Updated bio' },
        'user-1',
        false,
      );

      expect(result.bio).toBe('Updated bio');
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(mockProfile);

      await expect(
        service.update('profile-1', { bio: 'Hacked' }, 'other-user', false),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verify', () => {
    it('should verify a teacher profile', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(mockProfile);
      mockPrisma.teacherProfile.update.mockResolvedValue({
        ...mockProfile,
        isVerified: true,
        verifiedAt: new Date(),
      });

      const result = await service.verify('profile-1', 'admin-1');

      expect(result.isVerified).toBe(true);
    });

    it('should throw ConflictException if already verified', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue({
        ...mockProfile,
        isVerified: true,
      });

      await expect(service.verify('profile-1', 'admin-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete a teacher profile', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(mockProfile);
      mockPrisma.teacherProfile.update.mockResolvedValue({
        ...mockProfile,
        deletedAt: new Date(),
      });

      const result = await service.remove('profile-1', 'user-1', false);

      expect(result.message).toBe('Teacher profile deleted successfully');
    });

    it('should throw ForbiddenException if not owner and not admin', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(mockProfile);

      await expect(
        service.remove('profile-1', 'other-user', false),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
