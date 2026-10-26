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
import {
  buildSearchFilter,
  buildSoftDeleteFilter,
} from '../../database/helpers';
import { hashPassword } from '../../common/utils';
import { Role } from '../../common/enums';
import { CreateUserDto, UpdateUserDto, SuspendUserDto } from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private readonly userSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    isEmailVerified: true,
    isSuspended: true,
    suspendedAt: true,
    suspensionReason: true,
    suspendedUntil: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { skip, take, orderBy } = buildPrismaQueryOptions(query);
    const searchFilter = buildSearchFilter(query.search, [
      'email',
      'firstName',
      'lastName',
    ]);
    const softDeleteFilter = buildSoftDeleteFilter();

    const where = { ...softDeleteFilter, ...searchFilter };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.userSelect,
        skip,
        take,
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(users, query, total);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        isEmailVerified: true,
      },
      select: this.userSelect,
    });

    this.logger.log(`User created: ${user.email}`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: this.userSelect,
    });

    this.logger.log(`User updated: ${user.email}`);
    return user;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`User soft-deleted: ${id}`);
    return { message: 'User deleted successfully' };
  }

  async restore(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!user) {
      throw new NotFoundException('Deleted user not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`User restored: ${id}`);
    return { message: 'User restored successfully' };
  }

  async suspend(id: string, dto: SuspendUserDto, suspendedById: string) {
    const user = await this.findOne(id);

    if (user.role === Role.SUPER_ADMIN) {
      throw new ConflictException('Cannot suspend a Super Admin');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedById,
        suspensionReason: dto.reason,
        suspendedUntil: dto.suspendedUntil ? new Date(dto.suspendedUntil) : null,
      },
    });

    this.logger.log(`User suspended: ${id} by ${suspendedById}`);
    return { message: 'User suspended successfully' };
  }

  async unsuspend(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { ...this.userSelect, isSuspended: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isSuspended) {
      throw new ConflictException('User is not suspended');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspendedById: null,
        suspensionReason: null,
        suspendedUntil: null,
      },
    });

    this.logger.log(`User unsuspended: ${id}`);
    return { message: 'User unsuspended successfully' };
  }

  async bulkVerifyEmails(ids: string[]) {
    const result = await this.prisma.user.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { isEmailVerified: true },
    });

    this.logger.log(`Bulk verified ${result.count} users`);
    return { message: `${result.count} users verified successfully` };
  }

  async bulkUpdateRoles(ids: string[], role: Role) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, role: true },
    });

    const protectedIds = users
      .filter((u) => u.role === Role.SUPER_ADMIN)
      .map((u) => u.id);

    const updateIds = ids.filter((id) => !protectedIds.includes(id));

    const result = await this.prisma.user.updateMany({
      where: { id: { in: updateIds } },
      data: { role },
    });

    this.logger.log(`Bulk updated ${result.count} user roles`);
    return {
      message: `${result.count} users updated`,
      skipped: protectedIds.length,
    };
  }

  async bulkSuspend(ids: string[], reason: string, suspendedById: string) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, role: true },
    });

    const protectedIds = users
      .filter((u) => u.role === Role.SUPER_ADMIN)
      .map((u) => u.id);

    const suspendIds = ids.filter((id) => !protectedIds.includes(id));

    const result = await this.prisma.user.updateMany({
      where: { id: { in: suspendIds } },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedById,
        suspensionReason: reason,
      },
    });

    this.logger.log(`Bulk suspended ${result.count} users`);
    return {
      message: `${result.count} users suspended`,
      skipped: protectedIds.length,
    };
  }
}
