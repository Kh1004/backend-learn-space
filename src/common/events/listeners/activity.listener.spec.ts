import { Test, TestingModule } from '@nestjs/testing';
import { ActivityListener } from './activity.listener';
import { PrismaService } from '../../../database/prisma.service';

describe('ActivityListener', () => {
  let listener: ActivityListener;
  let prisma: {
    activityLog: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = { activityLog: { create: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityListener,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    listener = module.get(ActivityListener);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleActivity', () => {
    it('should create activity log entry', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: 'log-1' });

      await listener.handleActivity({
        userId: 'user-1',
        activityType: 'VIEW',
        resourceType: 'MATERIAL',
        resourceId: 'mat-1',
        metadata: { key: 'value' },
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'VIEW',
          resourceType: 'MATERIAL',
          resourceId: 'mat-1',
          metadata: { key: 'value' },
        },
      });
    });

    it('should handle null metadata', async () => {
      prisma.activityLog.create.mockResolvedValue({ id: 'log-1' });

      await listener.handleActivity({
        userId: 'user-1',
        activityType: 'READ',
        resourceType: 'SESSION',
        resourceId: 'sess-1',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          action: 'READ',
          resourceType: 'SESSION',
          resourceId: 'sess-1',
        }),
      });
    });

    it('should not throw on prisma error', async () => {
      prisma.activityLog.create.mockRejectedValue(new Error('DB error'));

      await expect(
        listener.handleActivity({
          userId: 'user-1',
          activityType: 'VIEW',
          resourceType: 'MATERIAL',
          resourceId: 'mat-1',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
