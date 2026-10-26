import { Test, TestingModule } from '@nestjs/testing';
import { NotificationListener } from './notification.listener';
import { PrismaService } from '../../../database/prisma.service';

describe('NotificationListener', () => {
  let listener: NotificationListener;
  let prisma: {
    userFollow: { findMany: jest.Mock };
    notification: { createMany: jest.Mock; create: jest.Mock };
    material: { update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      userFollow: { findMany: jest.fn() },
      notification: { createMany: jest.fn(), create: jest.fn() },
      material: { update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationListener,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    listener = module.get(NotificationListener);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleMaterialPublished', () => {
    it('should send notifications to followers', async () => {
      prisma.userFollow.findMany.mockResolvedValue([
        { followerId: 'follower-1' },
        { followerId: 'follower-2' },
      ]);
      prisma.notification.createMany.mockResolvedValue({ count: 2 });

      await listener.handleMaterialPublished({
        userId: 'author-1',
        materialId: 'mat-1',
        materialTitle: 'Test Material',
      });

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'follower-1',
            type: 'MATERIAL_PUBLISHED',
          }),
          expect.objectContaining({
            userId: 'follower-2',
            type: 'MATERIAL_PUBLISHED',
          }),
        ]),
      });
    });

    it('should not send notifications when no followers', async () => {
      prisma.userFollow.findMany.mockResolvedValue([]);

      await listener.handleMaterialPublished({
        userId: 'author-1',
        materialId: 'mat-1',
        materialTitle: 'Test',
      });

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe('handleMaterialViewed', () => {
    it('should increment view count', async () => {
      prisma.material.update.mockResolvedValue({});

      await listener.handleMaterialViewed({
        userId: 'user-1',
        materialId: 'mat-1',
      });

      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('handleMaterialDownloaded', () => {
    it('should increment download count', async () => {
      prisma.material.update.mockResolvedValue({});

      await listener.handleMaterialDownloaded({
        userId: 'user-1',
        materialId: 'mat-1',
      });

      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { downloadCount: { increment: 1 } },
      });
    });
  });

  describe('handleMaterialBookmarked', () => {
    it('should increment bookmark count', async () => {
      prisma.material.update.mockResolvedValue({});

      await listener.handleMaterialBookmarked({
        userId: 'user-1',
        materialId: 'mat-1',
      });

      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { bookmarkCount: { increment: 1 } },
      });
    });
  });

  describe('handleMaterialLiked', () => {
    it('should increment like count', async () => {
      prisma.material.update.mockResolvedValue({});

      await listener.handleMaterialLiked({
        userId: 'user-1',
        materialId: 'mat-1',
      });

      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { likeCount: { increment: 1 } },
      });
    });
  });

  describe('handleUserCreated', () => {
    it('should send welcome notification', async () => {
      prisma.notification.create.mockResolvedValue({});

      await listener.handleUserCreated({ userId: 'user-1' });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'WELCOME',
          title: 'Welcome!',
          message: 'Welcome to the education platform. Start exploring!',
        },
      });
    });
  });
});
