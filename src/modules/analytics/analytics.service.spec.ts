import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../database/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockPrisma = {
    teacherProfile: {
      findFirst: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    studentProfile: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    material: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    materialBookmark: {
      findMany: jest.fn(),
    },
    readingProgress: {
      findMany: jest.fn(),
    },
    materialView: {
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    fileUpload: {
      aggregate: jest.fn(),
    },
    activityLog: {
      groupBy: jest.fn(),
    },
    subject: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getTeacherDashboard', () => {
    it('should return profile, stats, and sorted topMaterials', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue({
        followerCount: 120,
        materialCount: 5,
        isVerified: true,
      });
      mockPrisma.material.findMany.mockResolvedValue([
        { id: 'm1', title: 'A', slug: 'a', type: 'PDF', status: 'PUBLISHED', viewCount: 10, downloadCount: 2, bookmarkCount: 1, likeCount: 3, commentCount: 0, readingTime: 5, publishedAt: new Date() },
        { id: 'm2', title: 'B', slug: 'b', type: 'VIDEO', status: 'PUBLISHED', viewCount: 50, downloadCount: 8, bookmarkCount: 5, likeCount: 12, commentCount: 2, readingTime: 10, publishedAt: new Date() },
        { id: 'm3', title: 'C', slug: 'c', type: 'PDF', status: 'DRAFT', viewCount: 30, downloadCount: 4, bookmarkCount: 2, likeCount: 7, commentCount: 1, readingTime: 8, publishedAt: null },
      ]);

      const result = await service.getTeacherDashboard('teacher-1');

      expect(result.profile.followerCount).toBe(120);
      expect(result.stats.totalMaterials).toBe(3);
      expect(result.stats.totalViews).toBe(90);
      expect(result.stats.totalDownloads).toBe(14);
      expect(result.stats.totalBookmarks).toBe(8);
      expect(result.stats.totalLikes).toBe(22);
      expect(result.stats.followers).toBe(120);
      expect(result.topMaterials[0].id).toBe('m2');
      expect(result.topMaterials[1].id).toBe('m3');
      expect(result.topMaterials[2].id).toBe('m1');
    });

    it('should return zero followers when profile is null', async () => {
      mockPrisma.teacherProfile.findFirst.mockResolvedValue(null);
      mockPrisma.material.findMany.mockResolvedValue([]);

      const result = await service.getTeacherDashboard('teacher-1');

      expect(result.stats.followers).toBe(0);
      expect(result.stats.totalMaterials).toBe(0);
    });
  });

  describe('getStudentDashboard', () => {
    it('should return profile, bookmarks, continueReading, and recentDownloads', async () => {
      mockPrisma.studentProfile.findFirst.mockResolvedValue({
        totalReadTime: 300,
        readingGoal: 60,
        interests: ['Math'],
        grade: { id: 'g1', name: 'Grade 10' },
      });
      mockPrisma.materialBookmark.findMany.mockResolvedValue([
        { material: { id: 'bm1', title: 'Book 1', slug: 'book-1', type: 'PDF', readingTime: 15, author: { firstName: 'Jane', lastName: 'Doe' } }, createdAt: new Date() },
      ]);
      mockPrisma.readingProgress.findMany.mockResolvedValue([
        { progressPercent: 45, readingTime: 10, material: { id: 'rp1', title: 'Reading 1', slug: 'reading-1', type: 'EPUB' } },
      ]);
      mockPrisma.materialView.findMany.mockResolvedValue([
        { material: { id: 'dv1', title: 'Download 1', type: 'PDF' }, createdAt: new Date() },
      ]);

      const result = await service.getStudentDashboard('student-1');

      expect(result.profile.totalReadTime).toBe(300);
      expect(result.bookmarks).toHaveLength(1);
      expect(result.bookmarks[0].material.author.firstName).toBe('Jane');
      expect(result.continueReading).toHaveLength(1);
      expect(result.continueReading[0].progressPercent).toBe(45);
      expect(result.recentDownloads).toHaveLength(1);
      expect(result.recentDownloads[0].material.title).toBe('Download 1');
    });
  });

  describe('getAdminDashboard', () => {
    it('should return all admin stats including popular and trending', async () => {
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.teacherProfile.count.mockResolvedValue(20);
      mockPrisma.studentProfile.count.mockResolvedValue(80);
      mockPrisma.material.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(35);
      mockPrisma.fileUpload.aggregate.mockResolvedValue({ _sum: { size: 1048576 } });
      mockPrisma.activityLog.groupBy.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
      mockPrisma.subject.findMany.mockResolvedValue([
        { id: 's1', name: 'Math', slug: 'math', _count: { materials: 15 } },
      ]);
      mockPrisma.teacherProfile.findMany.mockResolvedValue([
        { id: 'tp1', followerCount: 200, materialCount: 10, user: { firstName: 'A', lastName: 'B' } },
      ]);
      mockPrisma.material.findMany.mockResolvedValue([
        { id: 'tm1', title: 'Trending', slug: 'trending', type: 'PDF', viewCount: 500, likeCount: 50, bookmarkCount: 30, publishedAt: new Date(), author: { firstName: 'A', lastName: 'B' } },
      ]);

      const result = await service.getAdminDashboard();

      expect(result.users.total).toBe(100);
      expect(result.users.teachers).toBe(20);
      expect(result.users.students).toBe(80);
      expect(result.users.dailyActiveUsers).toBe(2);
      expect(result.materials.total).toBe(50);
      expect(result.materials.published).toBe(35);
      expect(result.storage.totalBytes).toBe(1048576);
      expect(result.popularSubjects).toHaveLength(1);
      expect(result.popularTeachers).toHaveLength(1);
      expect(result.popularTeachers[0].followerCount).toBe(200);
      expect(result.trendingMaterials).toHaveLength(1);
      expect(result.trendingMaterials[0].viewCount).toBe(500);
    });
  });
});
