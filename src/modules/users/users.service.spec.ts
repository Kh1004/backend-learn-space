import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Role } from '../../common/enums';
import { PaginationQueryDto } from '../../common/dtos';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.USER,
    isActive: true,
    isEmailVerified: true,
    isSuspended: false,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([mockUser]),
        findFirst: jest.fn().mockResolvedValue(mockUser),
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('suspend', () => {
    it('should suspend a user', async () => {
      const result = await service.suspend(
        'user-1',
        { reason: 'Violation' },
        'admin-1',
      );

      expect(result).toEqual({ message: 'User suspended successfully' });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isSuspended: true,
            suspendedAt: expect.any(Date),
            suspendedById: 'admin-1',
            suspensionReason: 'Violation',
          }),
        }),
      );
    });

    it('should throw ConflictException when suspending Super Admin', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        ...mockUser,
        role: Role.SUPER_ADMIN,
      });

      await expect(
        service.suspend('user-1', { reason: 'Test' }, 'admin-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.suspend('nonexistent', { reason: 'Test' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unsuspend', () => {
    it('should unsuspend a user', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        ...mockUser,
        isSuspended: true,
      });

      const result = await service.unsuspend('user-1');

      expect(result).toEqual({ message: 'User unsuspended successfully' });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isSuspended: false,
            suspendedAt: null,
            suspendedById: null,
            suspensionReason: null,
          }),
        }),
      );
    });

    it('should throw ConflictException when user is not suspended', async () => {
      await expect(service.unsuspend('user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null);

      await expect(service.unsuspend('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkVerifyEmails', () => {
    it('should bulk verify emails', async () => {
      const result = await service.bulkVerifyEmails(['user-1', 'user-2']);

      expect(result).toEqual({ message: '1 users verified successfully' });
      expect(prisma.user.updateMany).toHaveBeenCalled();
    });
  });

  describe('bulkUpdateRoles', () => {
    it('should bulk update roles', async () => {
      prisma.user.findMany.mockResolvedValueOnce([
        { id: 'user-1', role: Role.USER },
      ]);

      const result = await service.bulkUpdateRoles(['user-1'], Role.TEACHER);

      expect(result).toEqual({ message: '1 users updated', skipped: 0 });
      expect(prisma.user.updateMany).toHaveBeenCalled();
    });

    it('should skip Super Admin users', async () => {
      prisma.user.findMany.mockResolvedValueOnce([
        { id: 'user-1', role: Role.SUPER_ADMIN },
      ]);
      prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.bulkUpdateRoles(['user-1'], Role.TEACHER);

      expect(result).toEqual({ message: '0 users updated', skipped: 1 });
    });
  });

  describe('bulkSuspend', () => {
    it('should bulk suspend users', async () => {
      prisma.user.findMany.mockResolvedValueOnce([
        { id: 'user-1', role: Role.USER },
      ]);

      const result = await service.bulkSuspend(
        ['user-1'],
        'Violation',
        'admin-1',
      );

      expect(result).toEqual({ message: '1 users suspended', skipped: 0 });
      expect(prisma.user.updateMany).toHaveBeenCalled();
    });

    it('should skip Super Admin users', async () => {
      prisma.user.findMany.mockResolvedValueOnce([
        { id: 'user-1', role: Role.SUPER_ADMIN },
      ]);
      prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.bulkSuspend(
        ['user-1'],
        'Violation',
        'admin-1',
      );

      expect(result).toEqual({ message: '0 users suspended', skipped: 1 });
    });
  });
});
