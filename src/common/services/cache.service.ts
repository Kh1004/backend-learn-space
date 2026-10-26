import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Record<string, unknown>) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await (this.cache.get as <K>(key: string) => Promise<T>)(key);
    } catch (error) {
      this.logger.warn(`Cache get failed for key: ${key}`);
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await (this.cache.set as (key: string, value: unknown, ttl?: number) => Promise<void>)(key, value, ttl);
    } catch (error) {
      this.logger.warn(`Cache set failed for key: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await (this.cache.del as (key: string) => Promise<void>)(key);
    } catch (error) {
      this.logger.warn(`Cache delete failed for key: ${key}`);
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  generateMaterialKey(materialId: string): string {
    return `material:${materialId}`;
  }

  generateMaterialListKey(params: string): string {
    return `materials:list:${params}`;
  }

  generateUserKey(userId: string): string {
    return `user:${userId}`;
  }

  generateSettingsKey(): string {
    return 'settings:all';
  }

  generatePopularMaterialsKey(): string {
    return 'materials:popular';
  }
}
