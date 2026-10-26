import {
  PrismaClient,
  Role,
  MaterialType,
  MaterialStatus,
  MaterialVisibility,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('Admin@123456', 12);

  // ─── Users ────────────────────────────────────────────────────────────────

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@enterprise.com' },
    update: {},
    create: {
      email: 'admin@enterprise.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'user@enterprise.com' },
    update: {},
    create: {
      email: 'user@enterprise.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: Role.USER,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@enterprise.com' },
    update: {},
    create: {
      email: 'teacher@enterprise.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: Role.TEACHER,
      isActive: true,
      isEmailVerified: true,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@enterprise.com' },
    update: {},
    create: {
      email: 'student@enterprise.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Chen',
      role: Role.STUDENT,
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log('Users created');

  // ─── Subjects ─────────────────────────────────────────────────────────────

  const subjects = await Promise.all(
    [
      { name: 'Mathematics', description: 'Algebra, calculus, statistics and more' },
      { name: 'Physics', description: 'Mechanics, thermodynamics, electromagnetism' },
      { name: 'Chemistry', description: 'Organic, inorganic, and physical chemistry' },
      { name: 'Biology', description: 'Cell biology, genetics, ecology' },
      { name: 'English', description: 'Literature, grammar, and composition' },
      { name: 'Computer Science', description: 'Programming, algorithms, data structures' },
    ].map((s) =>
      prisma.subject.upsert({
        where: { slug: slugify(s.name) },
        update: {},
        create: { ...s, slug: slugify(s.name) },
      }),
    ),
  );

  console.log(`${subjects.length} subjects created`);

  // ─── Grades ───────────────────────────────────────────────────────────────

  const grades = await Promise.all(
    [
      { name: 'Grade 9', level: 9, description: 'Freshman year' },
      { name: 'Grade 10', level: 10, description: 'Sophomore year' },
      { name: 'Grade 11', level: 11, description: 'Junior year' },
      { name: 'Grade 12', level: 12, description: 'Senior year' },
    ].map((g) =>
      prisma.grade.upsert({
        where: { slug: slugify(g.name) },
        update: {},
        create: { ...g, slug: slugify(g.name) },
      }),
    ),
  );

  console.log(`${grades.length} grades created`);

  // ─── Categories ───────────────────────────────────────────────────────────

  const categories = await Promise.all(
    [
      { name: 'Past Papers', description: 'Previous exam papers' },
      { name: 'Study Notes', description: 'Comprehensive study materials' },
      { name: 'Tutorials', description: 'Step-by-step learning guides' },
      { name: 'Assignments', description: 'Practice exercises and homework' },
    ].map((c) =>
      prisma.category.upsert({
        where: { slug: slugify(c.name) },
        update: {},
        create: { ...c, slug: slugify(c.name) },
      }),
    ),
  );

  console.log(`${categories.length} categories created`);

  // ─── Tags ─────────────────────────────────────────────────────────────────

  const tags = await Promise.all(
    ['exam-prep', 'homework', 'advanced', 'beginner', 'video', 'pdf'].map(
      (t) =>
        prisma.tag.upsert({
          where: { slug: t },
          update: {},
          create: { name: t, slug: t },
        }),
    ),
  );

  console.log(`${tags.length} tags created`);

  // ─── Teacher Profile ──────────────────────────────────────────────────────

  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      bio: 'Experienced mathematics educator with 10+ years of teaching.',
      institution: 'State University',
      expertise: ['Algebra', 'Calculus', 'Statistics'],
      qualification: 'Ph.D. Mathematics',
      yearsOfExperience: 10,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedById: superAdmin.id,
    },
  });

  console.log(`Teacher profile created for ${teacherUser.email}`);

  // ─── Student Profile ──────────────────────────────────────────────────────

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      gradeId: grades[2].id,
      institution: 'Central High School',
      enrollmentYear: 2025,
      interests: ['Mathematics', 'Computer Science'],
      readingGoal: 60,
    },
  });

  console.log(`Student profile created for ${studentUser.email}`);

  // ─── Materials ────────────────────────────────────────────────────────────

  const material1 = await prisma.material.upsert({
    where: { slug: 'calculus-101-study-guide' },
    update: {},
    create: {
      title: 'Calculus 101 Study Guide',
      slug: 'calculus-101-study-guide',
      description: 'A comprehensive guide to introductory calculus.',
      type: MaterialType.NOTE,
      status: MaterialStatus.PUBLISHED,
      visibility: MaterialVisibility.PUBLIC,
      authorId: teacherUser.id,
      categoryId: categories[1].id,
      publishedAt: new Date(),
      readingTime: 45,
    },
  });

  const material2 = await prisma.material.upsert({
    where: { slug: 'physics-mechanics-past-paper-2024' },
    update: {},
    create: {
      title: 'Physics Mechanics Past Paper 2024',
      slug: 'physics-mechanics-past-paper-2024',
      description: 'Past exam paper covering mechanics topics.',
      type: MaterialType.PAST_PAPER,
      status: MaterialStatus.PUBLISHED,
      visibility: MaterialVisibility.PUBLIC,
      authorId: teacherUser.id,
      categoryId: categories[0].id,
      publishedAt: new Date(),
      readingTime: 30,
    },
  });

  console.log('Materials created');

  // ─── Material-Subject links ───────────────────────────────────────────────

  await prisma.materialSubject.createMany({
    data: [
      { materialId: material1.id, subjectId: subjects[0].id },
      { materialId: material2.id, subjectId: subjects[1].id },
    ],
    skipDuplicates: true,
  });

  // ─── Material-Grade links ─────────────────────────────────────────────────

  await prisma.materialGrade.createMany({
    data: [
      { materialId: material1.id, gradeId: grades[2].id },
      { materialId: material1.id, gradeId: grades[3].id },
      { materialId: material2.id, gradeId: grades[2].id },
    ],
    skipDuplicates: true,
  });

  // ─── Material-Tag links ───────────────────────────────────────────────────

  await prisma.materialTag.createMany({
    data: [
      { materialId: material1.id, tagId: tags[2].id },
      { materialId: material1.id, tagId: tags[5].id },
      { materialId: material2.id, tagId: tags[0].id },
      { materialId: material2.id, tagId: tags[5].id },
    ],
    skipDuplicates: true,
  });

  console.log('Material relations created');

  // ─── Platform Settings ───────────────────────────────────────────────────

  const settings = await Promise.all(
    [
      { key: 'site.name', value: 'Education Platform', description: 'Platform display name', category: 'general', isPublic: true },
      { key: 'site.description', value: 'Learning Management System for teachers and students', description: 'Platform description', category: 'general', isPublic: true },
      { key: 'site.logo', value: '/images/logo.png', description: 'Platform logo URL', category: 'general', isPublic: true },
      { key: 'site.favicon', value: '/favicon.ico', description: 'Favicon URL', category: 'general', isPublic: true },
      { key: 'auth.registrationEnabled', value: 'true', description: 'Allow new user registrations', category: 'auth', isPublic: false },
      { key: 'auth.emailVerificationRequired', value: 'true', description: 'Require email verification for new accounts', category: 'auth', isPublic: false },
      { key: 'auth.maxLoginAttempts', value: '5', description: 'Max failed login attempts before lockout', category: 'auth', isPublic: false },
      { key: 'auth.lockoutDurationMinutes', value: '30', description: 'Account lockout duration in minutes', category: 'auth', isPublic: false },
      { key: 'auth.passwordMinLength', value: '8', description: 'Minimum password length', category: 'auth', isPublic: false },
      { key: 'upload.maxFileSizeMB', value: '50', description: 'Maximum upload file size in MB', category: 'upload', isPublic: false },
      { key: 'upload.allowedTypes', value: 'pdf,doc,docx,ppt,pptx,jpg,png,mp4', description: 'Allowed file types for upload', category: 'upload', isPublic: false },
      { key: 'materials.moderationRequired', value: 'false', description: 'Require admin approval for published materials', category: 'materials', isPublic: false },
      { key: 'materials.maxBookmarksPerUser', value: '100', description: 'Maximum bookmarks per user', category: 'materials', isPublic: false },
      { key: 'notifications.emailEnabled', value: 'true', description: 'Enable email notifications', category: 'notifications', isPublic: false },
      { key: 'analytics.retentionDays', value: '365', description: 'Days to retain analytics data', category: 'analytics', isPublic: false },
    ].map((s) =>
      prisma.platformSetting.upsert({
        where: { key: s.key },
        update: {},
        create: s,
      }),
    ),
  );

  console.log(`${settings.length} platform settings created`);

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
