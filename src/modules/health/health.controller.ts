import { Controller, Get, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';
import { Public } from '../../common/decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController implements OnModuleDestroy {
  private redis: Redis | null = null;

  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service and database are healthy',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          status: 'ok',
          info: { database: { status: 'up' } },
          error: {},
          details: { database: { status: 'up' } },
        },
        requestId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  async check(): Promise<HealthCheckResult> {
    const checks = [() => this.prismaHealth.pingCheck('database', this.prisma)];

    if (this.configService.get<boolean>('redis.enabled')) {
      checks.push(() => this.checkRedis());
    }

    return this.health.check(checks);
  }

  @Get('ping')
  @Public()
  @ApiOperation({ summary: 'Simple ping endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is running',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          status: 'ok',
          timestamp: '2024-01-01T00:00:00.000Z',
          uptime: 1234.567,
        },
        requestId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      if (!this.redis) {
        const host =
          this.configService.get<string>('redis.host') || 'localhost';
        const port = this.configService.get<number>('redis.port') || 6379;
        const password = this.configService.get<string>('redis.password');

        this.redis = new Redis({ host, port, password, lazyConnect: true });
        await this.redis.connect();
      }

      const pong = await this.redis.ping();
      return { redis: { status: pong === 'PONG' ? 'up' : 'down' } };
    } catch {
      return { redis: { status: 'down' } };
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}
