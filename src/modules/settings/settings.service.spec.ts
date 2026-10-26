import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dtos';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: {
    platformSetting: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      upsert: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  const mockSetting = {
    id: 'setting-1',
    key: 'site.name',
    value: 'Education Platform',
    description: 'Platform name',
    category: 'general',
    isPublic: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      platformSetting: {
        findMany: jest.fn().mockResolvedValue([mockSetting]),
        findFirst: jest.fn().mockResolvedValue(mockSetting),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockSetting),
        update: jest.fn().mockResolvedValue(mockSetting),
        upsert: jest.fn().mockResolvedValue(mockSetting),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated settings', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10 };
      const result = await service.findAll(query);

      expect(result).toBeDefined();
      expect(prisma.platformSetting.findMany).toHaveBeenCalled();
      expect(prisma.platformSetting.count).toHaveBeenCalled();
    });
  });

  describe('findByCategory', () => {
    it('should return settings for a category', async () => {
      const result = await service.findByCategory('general');

      expect(result).toEqual([mockSetting]);
      expect(prisma.platformSetting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'general' }),
        }),
      );
    });
  });

  describe('findPublic', () => {
    it('should return public settings', async () => {
      const result = await service.findPublic();

      expect(result).toEqual([mockSetting]);
      expect(prisma.platformSetting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublic: true }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a setting by id', async () => {
      const result = await service.findOne('setting-1');

      expect(result).toEqual(mockSetting);
    });

    it('should throw NotFoundException when setting not found', async () => {
      prisma.platformSetting.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByKey', () => {
    it('should return a setting by key', async () => {
      const result = await service.findByKey('site.name');

      expect(result).toEqual(mockSetting);
    });

    it('should throw NotFoundException when key not found', async () => {
      prisma.platformSetting.findFirst.mockResolvedValueOnce(null);

      await expect(service.findByKey('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new setting', async () => {
      prisma.platformSetting.findFirst.mockResolvedValueOnce(null);

      const result = await service.create({
        key: 'site.name',
        value: 'Education Platform',
      });

      expect(result).toEqual(mockSetting);
      expect(prisma.platformSetting.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when key already exists', async () => {
      await expect(
        service.create({ key: 'site.name', value: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a setting', async () => {
      const result = await service.update('setting-1', {
        value: 'Updated Platform',
      });

      expect(result).toEqual(mockSetting);
      expect(prisma.platformSetting.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when setting not found', async () => {
      prisma.platformSetting.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update('nonexistent', { value: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsert', () => {
    it('should upsert a setting', async () => {
      const result = await service.upsert(
        'site.name',
        'Education Platform',
        'Platform name',
      );

      expect(result).toEqual(mockSetting);
      expect(prisma.platformSetting.upsert).toHaveBeenCalled();
    });
  });

  describe('bulkUpdate', () => {
    it('should bulk update settings', async () => {
      const result = await service.bulkUpdate([
        { key: 'site.name', value: 'Platform' },
        { key: 'site.description', value: 'Description' },
      ]);

      expect(result).toHaveLength(2);
      expect(prisma.platformSetting.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove', () => {
    it('should soft delete a setting', async () => {
      const result = await service.remove('setting-1');

      expect(result).toEqual({ message: 'Setting deleted successfully' });
      expect(prisma.platformSetting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw NotFoundException when setting not found', async () => {
      prisma.platformSetting.findFirst.mockResolvedValueOnce(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a deleted setting', async () => {
      prisma.platformSetting.findFirst.mockResolvedValueOnce({
        ...mockSetting,
        deletedAt: new Date(),
      });

      const result = await service.restore('setting-1');

      expect(result).toEqual({ message: 'Setting restored successfully' });
    });

    it('should throw NotFoundException when deleted setting not found', async () => {
      prisma.platformSetting.findFirst.mockResolvedValueOnce(null);

      await expect(service.restore('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
