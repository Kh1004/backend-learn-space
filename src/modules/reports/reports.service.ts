import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../common/dtos';
import {
  buildPaginatedResult,
  buildPrismaQueryOptions,
} from '../../common/utils';
import { buildSoftDeleteFilter } from '../../database/helpers';
import { CreateReportDto, ResolveReportDto } from './dto';
import { Prisma, ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  private readonly reportSelect = {
    id: true,
    reason: true,
    description: true,
    status: true,
    resolvedAt: true,
    resolution: true,
    createdAt: true,
    material: {
      select: { id: true, title: true, slug: true },
    },
    reporter: {
      select: { id: true, firstName: true, lastName: true, email: true },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where = { ...softDeleteFilter };

    const [reports, total] = await Promise.all([
      this.prisma.materialReport.findMany({
        where,
        select: this.reportSelect,
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      this.prisma.materialReport.count({ where }),
    ]);

    return buildPaginatedResult(reports, query, total);
  }

  async findOne(id: string) {
    const report = await this.prisma.materialReport.findFirst({
      where: { id },
      select: this.reportSelect,
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async findByMaterial(materialId: string, query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);

    const where = { materialId };

    const [reports, total] = await Promise.all([
      this.prisma.materialReport.findMany({
        where,
        select: this.reportSelect,
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      this.prisma.materialReport.count({ where }),
    ]);

    return buildPaginatedResult(reports, query, total);
  }

  async create(dto: CreateReportDto, reporterId: string) {
    const material = await this.prisma.material.findFirst({
      where: { id: dto.materialId, deletedAt: null },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const existingReport = await this.prisma.materialReport.findFirst({
      where: {
        materialId: dto.materialId,
        reporterId,
        status: { in: [ReportStatus.PENDING, ReportStatus.REVIEWING] },
      },
    });

    if (existingReport) {
      throw new ConflictException(
        'You already have an open report for this material',
      );
    }

    const report = await this.prisma.materialReport.create({
      data: {
        materialId: dto.materialId,
        reporterId,
        reason: dto.reason,
        description: dto.description,
      },
      select: this.reportSelect,
    });

    this.logger.log(
      `Report created by ${reporterId} for material ${dto.materialId}`,
    );
    return report;
  }

  async resolve(id: string, dto: ResolveReportDto, resolvedById: string) {
    const existing = await this.findOne(id);

    if (existing.status === ReportStatus.RESOLVED) {
      throw new ConflictException('Report is already resolved');
    }

    const report = await this.prisma.materialReport.update({
      where: { id },
      data: {
        status: ReportStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedById,
        resolution: dto.resolution,
      },
      select: this.reportSelect,
    });

    this.logger.log(`Report resolved: ${id} by ${resolvedById}`);
    return report;
  }

  async dismiss(id: string, resolvedById: string) {
    const existing = await this.findOne(id);

    if (existing.status === ReportStatus.RESOLVED) {
      throw new ConflictException('Report is already resolved');
    }

    if (existing.status === ReportStatus.DISMISSED) {
      throw new ConflictException('Report is already dismissed');
    }

    const report = await this.prisma.materialReport.update({
      where: { id },
      data: {
        status: ReportStatus.DISMISSED,
        resolvedAt: new Date(),
        resolvedById,
      },
      select: this.reportSelect,
    });

    this.logger.log(`Report dismissed: ${id} by ${resolvedById}`);
    return report;
  }
}
