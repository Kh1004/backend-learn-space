import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../database/prisma.service';
import { ReportStatus } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;

  const reportId = 'report-1';
  const materialId = 'mat-1';
  const reporterId = 'user-1';
  const resolvedById = 'admin-1';

  const mockReport = {
    id: reportId,
    reason: 'SPAM',
    description: 'Test description',
    status: ReportStatus.PENDING,
    resolvedAt: null,
    resolution: null,
    createdAt: new Date(),
    material: { id: materialId, title: 'Test Material', slug: 'test-material' },
    reporter: { id: reporterId, firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
  };

  const mockPrisma = {
    materialReport: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    material: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('findAll', () => {
    it('should return paginated reports', async () => {
      mockPrisma.materialReport.findMany.mockResolvedValue([mockReport]);
      mockPrisma.materialReport.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 } as never);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a report by id', async () => {
      mockPrisma.materialReport.findFirst.mockResolvedValue(mockReport);

      const result = await service.findOne(reportId);

      expect(result.id).toBe(reportId);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.materialReport.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = { materialId, reason: 'SPAM', description: 'Test' } as never;

    it('should create a report', async () => {
      mockPrisma.material.findFirst.mockResolvedValue({ id: materialId });
      mockPrisma.materialReport.findFirst.mockResolvedValue(null);
      mockPrisma.materialReport.create.mockResolvedValue(mockReport);

      const result = await service.create(createDto, reporterId);

      expect(result.id).toBe(reportId);
      expect(mockPrisma.materialReport.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if material not found', async () => {
      mockPrisma.material.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, reporterId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user already has open report', async () => {
      mockPrisma.material.findFirst.mockResolvedValue({ id: materialId });
      mockPrisma.materialReport.findFirst.mockResolvedValue(mockReport);

      await expect(service.create(createDto, reporterId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('resolve', () => {
    const resolveDto = { resolution: 'Handled' } as never;

    it('should resolve a report', async () => {
      mockPrisma.materialReport.findFirst.mockResolvedValue(mockReport);
      mockPrisma.materialReport.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
      });

      const result = await service.resolve(reportId, resolveDto, resolvedById);

      expect(result.status).toBe(ReportStatus.RESOLVED);
    });

    it('should throw ConflictException if already resolved', async () => {
      mockPrisma.materialReport.findFirst.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.RESOLVED,
      });

      await expect(
        service.resolve(reportId, resolveDto, resolvedById),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('dismiss', () => {
    it('should dismiss a report', async () => {
      mockPrisma.materialReport.findFirst.mockResolvedValue(mockReport);
      mockPrisma.materialReport.update.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.DISMISSED,
      });

      const result = await service.dismiss(reportId, resolvedById);

      expect(result.status).toBe(ReportStatus.DISMISSED);
    });

    it('should throw ConflictException if already dismissed', async () => {
      mockPrisma.materialReport.findFirst.mockResolvedValue({
        ...mockReport,
        status: ReportStatus.DISMISSED,
      });

      await expect(service.dismiss(reportId, resolvedById)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
