import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, MaterialStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTeacherDashboard(teacherId: string) {
    const teacherProfile = await this.prisma.teacherProfile.findFirst({
      where: { userId: teacherId, deletedAt: null },
      select: {
        followerCount: true,
        materialCount: true,
        isVerified: true,
      },
    });

    const materials = await this.prisma.material.findMany({
      where: { authorId: teacherId, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        viewCount: true,
        downloadCount: true,
        bookmarkCount: true,
        likeCount: true,
        commentCount: true,
        readingTime: true,
        publishedAt: true,
      },
    });

    const totalViews = materials.reduce((sum, m) => sum + m.viewCount, 0);
    const totalDownloads = materials.reduce((sum, m) => sum + m.downloadCount, 0);
    const totalBookmarks = materials.reduce((sum, m) => sum + m.bookmarkCount, 0);
    const totalLikes = materials.reduce((sum, m) => sum + m.likeCount, 0);

    const topMaterials = [...materials]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    return {
      profile: teacherProfile,
      stats: {
        totalMaterials: materials.length,
        totalViews,
        totalDownloads,
        totalBookmarks,
        totalLikes,
        followers: teacherProfile?.followerCount ?? 0,
      },
      materials,
      topMaterials,
    };
  }

  async getStudentDashboard(studentId: string) {
    const studentProfile = await this.prisma.studentProfile.findFirst({
      where: { userId: studentId, deletedAt: null },
      select: {
        totalReadTime: true,
        readingGoal: true,
        interests: true,
        grade: { select: { id: true, name: true } },
      },
    });

    const bookmarks = await this.prisma.materialBookmark.findMany({
      where: { userId: studentId },
      select: {
        material: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            readingTime: true,
            author: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const readingProgress = await this.prisma.readingProgress.findMany({
      where: { userId: studentId, isCompleted: false },
      select: {
        progressPercent: true,
        readingTime: true,
        material: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    const recentDownloads = await this.prisma.materialView.findMany({
      where: { userId: studentId },
      select: {
        material: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      profile: studentProfile,
      bookmarks,
      continueReading: readingProgress,
      recentDownloads,
    };
  }

  async getAdminDashboard() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalMaterials,
      publishedMaterials,
      totalStorage,
      dailyActiveUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.teacherProfile.count({ where: { deletedAt: null } }),
      this.prisma.studentProfile.count({ where: { deletedAt: null } }),
      this.prisma.material.count({ where: { deletedAt: null } }),
      this.prisma.material.count({
        where: { status: MaterialStatus.PUBLISHED, deletedAt: null },
      }),
      this.prisma.fileUpload.aggregate({
        _sum: { size: true },
      }),
      this.prisma.activityLog
        .groupBy({
          by: ['userId'],
          where: { createdAt: { gte: thirtyDaysAgo } },
          _count: { id: true },
        })
        .then((result) => result.length),
    ]);

    const popularSubjects = await this.prisma.subject.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { materials: true } },
      },
      orderBy: { materials: { _count: 'desc' } },
      take: 10,
    });

    const popularTeachers = await this.prisma.teacherProfile.findMany({
      where: { deletedAt: null, isVerified: true },
      select: {
        id: true,
        followerCount: true,
        materialCount: true,
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { followerCount: 'desc' },
      take: 10,
    });

    const trendingMaterials = await this.prisma.material.findMany({
      where: { status: MaterialStatus.PUBLISHED, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        viewCount: true,
        likeCount: true,
        bookmarkCount: true,
        publishedAt: true,
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });

    return {
      users: {
        total: totalUsers,
        teachers: totalTeachers,
        students: totalStudents,
        dailyActiveUsers,
      },
      materials: {
        total: totalMaterials,
        published: publishedMaterials,
      },
      storage: {
        totalBytes: totalStorage._sum?.size ?? 0,
      },
      popularSubjects,
      popularTeachers,
      trendingMaterials,
    };
  }
}
