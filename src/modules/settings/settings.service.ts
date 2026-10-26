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
import { CreateSettingDto, UpdateSettingDto } from './dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  private readonly settingSelect = {
    id: true,
    key: true,
    value: true,
    description: true,
    category: true,
    isPublic: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where = { ...softDeleteFilter };

    const [settings, total] = await Promise.all([
      this.prisma.platformSetting.findMany({
        where,
        select: this.settingSelect,
        skip,
        take,
        orderBy: orderBy || { key: 'asc' },
      }),
      this.prisma.platformSetting.count({ where }),
    ]);

    return buildPaginatedResult(settings, query, total);
  }

  async findByCategory(category: string) {
    const settings = await this.prisma.platformSetting.findMany({
      where: {
        category,
        isActive: true,
        deletedAt: null,
      },
      select: this.settingSelect,
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  async findPublic() {
    const settings = await this.prisma.platformSetting.findMany({
      where: {
        isPublic: true,
        isActive: true,
        deletedAt: null,
      },
      select: this.settingSelect,
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  async findOne(id: string) {
    const setting = await this.prisma.platformSetting.findFirst({
      where: { id, deletedAt: null },
      select: this.settingSelect,
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }

  async findByKey(key: string) {
    const setting = await this.prisma.platformSetting.findFirst({
      where: { key, deletedAt: null },
      select: this.settingSelect,
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  async create(dto: CreateSettingDto) {
    const existing = await this.prisma.platformSetting.findFirst({
      where: { key: dto.key, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException(`Setting with key '${dto.key}' already exists`);
    }

    const setting = await this.prisma.platformSetting.create({
      data: {
        key: dto.key,
        value: dto.value,
        description: dto.description,
        category: dto.category || 'general',
        isPublic: dto.isPublic || false,
      },
      select: this.settingSelect,
    });

    this.logger.log(`Setting created: ${setting.key}`);
    return setting;
  }

  async update(id: string, dto: UpdateSettingDto) {
    await this.findOne(id);

    const setting = await this.prisma.platformSetting.update({
      where: { id },
      data: dto,
      select: this.settingSelect,
    });

    this.logger.log(`Setting updated: ${setting.key}`);
    return setting;
  }

  async upsert(key: string, value: string, description?: string) {
    const setting = await this.prisma.platformSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        description,
        category: 'general',
      },
      update: { value, description },
      select: this.settingSelect,
    });

    this.logger.log(`Setting upserted: ${key}`);
    return setting;
  }

  async bulkUpdate(
    updates: Array<{ key: string; value: string; description?: string }>,
  ) {
    const results = await Promise.all(
      updates.map((item) => this.upsert(item.key, item.value, item.description)),
    );

    this.logger.log(`Bulk updated ${results.length} settings`);
    return results;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.platformSetting.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Setting soft-deleted: ${id}`);
    return { message: 'Setting deleted successfully' };
  }

  async restore(id: string) {
    const setting = await this.prisma.platformSetting.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!setting) {
      throw new NotFoundException('Deleted setting not found');
    }

    await this.prisma.platformSetting.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`Setting restored: ${id}`);
    return { message: 'Setting restored successfully' };
  }
}
