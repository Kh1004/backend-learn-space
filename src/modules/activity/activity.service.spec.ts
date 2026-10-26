import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { PrismaService } from '../../database/prisma.service';

describe('ActivityService', () => {
  let service: ActivityService;

  const mockPrisma = {
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  describe('findAll', () => {
    it('should return paginated activity logs', async () => {
      const logs = [{ id: 'log-1', action: 'CREATE' }];
      mockPrisma.activityLog.findMany.mockResolvedValue(logs);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(logs);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by action, resourceType, and userId', async () => {
      mockPrisma.activityLog.findMany.mockResolvedValue([]);
      mockPrisma.activityLog.count.mockResolvedValue(0);

      await service.findAll({
        action: 'VIEW',
        resourceType: 'Material',
        userId: 'user-1',
      });

      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'VIEW',
            resourceType: 'Material',
            userId: 'user-1',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      mockPrisma.activityLog.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a single activity log', async () => {
      const log = { id: 'log-1', action: 'CREATE' };
      mockPrisma.activityLog.findFirst.mockResolvedValue(log);

      const result = await service.findOne('log-1');

      expect(result).toEqual(log);
    });
  });

  describe('findByUser', () => {
    it('should return paginated logs for a user', async () => {
      const logs = [{ id: 'log-1', action: 'LOGIN' }];
      mockPrisma.activityLog.findMany.mockResolvedValue(logs);
      mockPrisma.activityLog.count.mockResolvedValue(1);

      const result = await service.findByUser('user-1', { page: 1, limit: 10 });

      expect(result.data).toEqual(logs);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });
  });

  describe('log', () => {
    it('should create an activity log entry', async () => {
      const created = { id: 'log-1', action: 'CREATE' };
      mockPrisma.activityLog.create.mockResolvedValue(created);

      const dto = {
        action: 'CREATE',
        resourceType: 'Material',
        resourceId: 'res-1',
        metadata: { key: 'value' },
      };

      const result = await service.log(dto, 'user-1', '127.0.0.1', 'Mozilla');

      expect(result).toEqual(created);
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'CREATE',
          resourceType: 'Material',
          resourceId: 'res-1',
          metadata: { key: 'value' },
          ip: '127.0.0.1',
          userAgent: 'Mozilla',
        },
        select: expect.any(Object),
      });
    });
  });
});
