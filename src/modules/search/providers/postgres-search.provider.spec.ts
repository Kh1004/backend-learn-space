import { Test, TestingModule } from '@nestjs/testing';
import { PostgresSearchProvider } from './postgres-search.provider';
import { PrismaService } from '../../../database/prisma.service';

const mockPrisma = {
  material: { findMany: jest.fn().mockResolvedValue([]) },
  subject: { findMany: jest.fn().mockResolvedValue([]) },
  category: { findMany: jest.fn().mockResolvedValue([]) },
  tag: { findMany: jest.fn().mockResolvedValue([]) },
  teacherProfile: { findMany: jest.fn().mockResolvedValue([]) },
};

describe('PostgresSearchProvider', () => {
  let provider: PostgresSearchProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresSearchProvider,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    provider = module.get(PostgresSearchProvider);
    jest.clearAllMocks();
  });

  it('search returns materials', async () => {
    const materials = [{ id: '1', title: 'Intro to Math', slug: 'intro-math', type: 'PDF', description: 'Basics', viewCount: 100 }];
    mockPrisma.material.findMany.mockResolvedValueOnce(materials);

    const result = await provider.search({ query: 'Math', types: ['material'], limit: 10 });

    expect(result.items).toEqual(materials);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.query).toBe('Math');
    expect(result.took).toBeGreaterThanOrEqual(0);
  });

  it('search returns subjects', async () => {
    const subjects = [{ id: '1', name: 'Physics', slug: 'physics', description: 'Study of matter' }];
    mockPrisma.subject.findMany.mockResolvedValueOnce(subjects);

    const result = await provider.search({ query: 'Physics', types: ['subject'] });

    expect(result.items).toEqual(subjects);
    expect(result.total).toBe(1);
    expect(mockPrisma.subject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({ contains: '%Physics%' }),
        }),
      }),
    );
  });

  it('search returns empty for unsupported type', async () => {
    const result = await provider.search({ query: 'test', types: ['user'] });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('index is a no-op', async () => {
    await expect(provider.index('material', '123', { title: 'test' })).resolves.toBeUndefined();
  });

  it('remove is a no-op', async () => {
    await expect(provider.remove('material', '123')).resolves.toBeUndefined();
  });
});
