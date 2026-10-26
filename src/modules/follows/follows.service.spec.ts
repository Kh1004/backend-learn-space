import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FollowsService } from './follows.service';
import { PrismaService } from '../../database/prisma.service';

describe('FollowsService', () => {
  let service: FollowsService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
    },
    userFollow: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<FollowsService>(FollowsService);
  });

  describe('toggle', () => {
    it('should create a follow when none exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-2' });
      mockPrisma.userFollow.findUnique.mockResolvedValue(null);
      mockPrisma.userFollow.create.mockResolvedValue({});

      const result = await service.toggle('user-1', 'user-2');

      expect(result).toEqual({ following: true });
      expect(mockPrisma.userFollow.create).toHaveBeenCalledWith({
        data: { followerId: 'user-1', followingId: 'user-2' },
      });
    });

    it('should remove follow when it already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-2' });
      mockPrisma.userFollow.findUnique.mockResolvedValue({
        id: 'follow-1',
        followerId: 'user-1',
        followingId: 'user-2',
      });
      mockPrisma.userFollow.delete.mockResolvedValue({});

      const result = await service.toggle('user-1', 'user-2');

      expect(result).toEqual({ following: false });
      expect(mockPrisma.userFollow.delete).toHaveBeenCalledWith({
        where: { id: 'follow-1' },
      });
    });

    it('should throw ForbiddenException for self-follow', async () => {
      await expect(service.toggle('user-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.toggle('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFollowers', () => {
    it('should return paginated followers', async () => {
      const followers = [
        {
          id: 'follow-1',
          createdAt: new Date(),
          follower: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@test.com',
          },
        },
      ];
      mockPrisma.userFollow.findMany.mockResolvedValue(followers);
      mockPrisma.userFollow.count.mockResolvedValue(1);

      const result = await service.getFollowers('user-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getFollowing', () => {
    it('should return paginated following', async () => {
      const following = [
        {
          id: 'follow-1',
          createdAt: new Date(),
          following: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@test.com',
          },
        },
      ];
      mockPrisma.userFollow.findMany.mockResolvedValue(following);
      mockPrisma.userFollow.count.mockResolvedValue(1);

      const result = await service.getFollowing('user-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('check', () => {
    it('should return following true when follow exists', async () => {
      mockPrisma.userFollow.findUnique.mockResolvedValue({ id: 'follow-1' });

      const result = await service.check('user-1', 'user-2');

      expect(result).toEqual({ following: true });
    });

    it('should return following false when follow does not exist', async () => {
      mockPrisma.userFollow.findUnique.mockResolvedValue(null);

      const result = await service.check('user-1', 'user-2');

      expect(result).toEqual({ following: false });
    });
  });
});
