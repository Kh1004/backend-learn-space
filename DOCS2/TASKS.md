# Education Content Platform — Task Tracker

> **How to use**: Update `[ ]` → `[x]` when done. Add date + notes.
> Last updated: 2026-07-23

---

## Overall Progress

| Phase | Total Tasks | Done | Status |
|-------|-------------|------|--------|
| Phase 0 — Foundation Fixes | 9 | 0 | Not started |
| Phase 1 — Domain Models | 15 | 0 | Not started |
| Phase 2 — Permission System | 5 | 0 | Not started |
| Phase 3 — Teacher & Student | 5 | 0 | Not started |
| Phase 4 — Material System | 10 | 0 | Not started |
| Phase 5 — Social Features | 4 | 0 | Not started |
| Phase 6 — Activity & Analytics | 7 | 0 | Not started |
| Phase 7 — Search Abstraction | 4 | 0 | Not started |
| Phase 8 — Notifications & Reports | 4 | 0 | Not started |
| Phase 9 — Settings & Admin | 4 | 0 | Not started |
| Phase 10 — Performance | 5 | 0 | Not started |
| Phase 11 — Testing & Docs | 5 | 0 | Not started |
| Phase 12 — Deployment & DevOps | 6 | 0 | Not started |
| **TOTAL** | **83** | **0** | |

---

## Phase 0 — Foundation Fixes (Prerequisites)

> Fix gaps in existing framework before education features.

- [ ] **0.1** Expand `Role` enum — add `TEACHER`, `STUDENT` to Prisma schema
  - File: `prisma/schema.prisma`
  - Keep or remove `USER` role? Decision needed.
  - Date:
  - Notes:

- [ ] **0.2** Add `createdBy`, `updatedBy`, `version` fields to all existing tables
  - Tables: User, Session, AuditLog, FeatureFlag, Notification, Webhook, WebhookLog, FileUpload
  - Date:
  - Notes:

- [ ] **0.3** Fix missing foreign keys — add Prisma `@relation` directives
  - `Notification.userId` → `User.id`
  - `WebhookLog.webhookId` → `Webhook.id`
  - `FileUpload.uploadedBy` → `User.id`
  - `Webhook.createdBy` → `User.id`
  - Date:
  - Notes:

- [ ] **0.4** Enable PermissionsGuard — register globally or per-route
  - Define full permission matrix in `Permission` enum
  - File: `src/common/guards/permissions.guard.ts`
  - Date:
  - Notes:

- [ ] **0.5** Wire EventBus — configure `@nestjs/event-emitter`
  - Create event classes directory: `src/common/events/`
  - Define base event class
  - Register `EventEmitterModule.forRoot()` in `app.module.ts`
  - Date:
  - Notes:

- [ ] **0.6** Import `QueueConfigModule` into `app.module.ts`
  - File: `src/app.module.ts`
  - Date:
  - Notes:

- [ ] **0.7** Register `AuditInterceptor` globally in `app.module.ts`
  - Use `APP_INTERCEPTOR` token
  - Date:
  - Notes:

- [ ] **0.8** Fix Redis health check — reuse shared Redis instance
  - File: `src/modules/health/health.controller.ts`
  - Inject Redis from CacheConfigModule instead of creating new connection
  - Date:
  - Notes:

- [ ] **0.9** Enable `noImplicitAny: true` in `tsconfig.json`
  - Fix all resulting type errors
  - Date:
  - Notes:

---

## Phase 1 — Education Domain Models (Prisma Schema)

> Create all models. Foundation for everything.

### 1A: Core Identity

- [ ] **1.1** Create `TeacherProfile` model
  - Fields: userId(FK), bio, specialization, isVerified, verifiedAt, verifiedBy, totalMaterials, followerCount
  - Relation: User 1:1
  - Date:
  - Notes:

- [ ] **1.2** Create `StudentProfile` model
  - Fields: userId(FK), gradeId(FK), school, enrolledAt
  - Relations: User 1:1, Grade N:1
  - Date:
  - Notes:

### 1B: Content Taxonomy

- [ ] **1.3** Create `Subject` model
  - Fields: name, slug(unique), description, icon, isActive, sortOrder
  - Date:
  - Notes:

- [ ] **1.4** Create `Grade` model
  - Fields: name, slug(unique), sortOrder, isActive
  - Date:
  - Notes:

- [ ] **1.5** Create `Category` model (self-referential hierarchy)
  - Fields: name, slug(unique), parentId(FK self-ref), icon, sortOrder, isActive
  - Relations: Category parent 1:N children
  - Date:
  - Notes:

- [ ] **1.6** Create `Tag` model
  - Fields: name(unique), slug(unique), usageCount
  - Date:
  - Notes:

### 1C: Material System

- [ ] **1.7** Create `MaterialType` enum
  - Values: PAST_PAPER, MODEL_PAPER, NOTE, BOOK, VIDEO, TUTORIAL, ASSIGNMENT, PRESENTATION
  - Date:
  - Notes:

- [ ] **1.8** Create `MaterialStatus` enum
  - Values: DRAFT, PENDING, PUBLISHED, ARCHIVED
  - Date:
  - Notes:

- [ ] **1.9** Create `MaterialVisibility` enum
  - Values: PUBLIC, PRIVATE, FOLLOWERS, GROUP, PREMIUM
  - Date:
  - Notes:

- [ ] **1.10** Create `Material` model
  - Fields: title, description, teacherId(FK), subjectId(FK), categoryId(FK), gradeId(FK), type(enum), status(enum), visibility(enum), language, thumbnailUrl, publishedAt, viewCount, downloadCount, likeCount, bookmarkCount, metadata(JSONB)
  - Relations: TeacherProfile N:1, Subject N:1, Category N:1, Grade N:1, MaterialFile 1:N, MaterialTag 1:N, Comment 1:N, Bookmark 1:N, ReadingProgress 1:N, Reaction polymorphic
  - Indexes: teacherId, subjectId, categoryId, gradeId, status, type, createdAt
  - Date:
  - Notes:

- [ ] **1.11** Create `MaterialTag` join table
  - Fields: materialId(FK), tagId(FK)
  - Unique constraint: [materialId, tagId]
  - Date:
  - Notes:

- [ ] **1.12** Create `MaterialFile` model
  - Fields: materialId(FK), fileUploadId(FK), sortOrder, isPrimary
  - Relations: Material N:1, FileUpload N:1
  - Date:
  - Notes:

### 1D: Social / Engagement

- [ ] **1.13** Create `Comment` model (self-referential for replies)
  - Fields: materialId(FK), userId(FK), parentId(FK self-ref), content, isReported, reportReason, depth
  - Relations: Material N:1, User N:1, Comment parent 1:N children
  - Indexes: materialId, userId, parentId
  - Date:
  - Notes:

- [ ] **1.14** Create `Reaction` model (polymorphic)
  - Fields: userId(FK), targetType(MATERIAL/COMMENT), targetId, type(LIKE)
  - Unique constraint: [userId, targetType, targetId]
  - Date:
  - Notes:

- [ ] **1.15** Create `Bookmark` model
  - Fields: userId(FK), materialId(FK)
  - Unique constraint: [userId, materialId]
  - Relations: User N:1, Material N:1
  - Date:
  - Notes:

- [ ] **1.16** Create `ReadingProgress` model
  - Fields: userId(FK), materialId(FK), currentPage, progressPercent, readingTimeSeconds, lastReadAt, isCompleted
  - Unique constraint: [userId, materialId]
  - Relations: User N:1, Material N:1
  - Date:
  - Notes:

### 1E: Analytics / Activity

- [ ] **1.17** Create `ActivityAction` enum
  - Values: VIEW, OPEN, READ, DOWNLOAD, BOOKMARK, LIKE, COMMENT, REPORT, FOLLOW, LOGIN, LOGOUT, SEARCH
  - Date:
  - Notes:

- [ ] **1.18** Create `Activity` model
  - Fields: userId(FK), action(enum), targetType, targetId, metadata(JSONB), ipAddress, userAgent
  - Indexes: userId, action, targetType+targetId, createdAt
  - Date:
  - Notes:

- [ ] **1.19** Create `ReportStatus` enum
  - Values: PENDING, REVIEWED, RESOLVED, DISMISSED
  - Date:
  - Notes:

- [ ] **1.20** Create `Report` model
  - Fields: reporterId(FK), targetType, targetId, reason, description, status(enum), resolvedBy, resolvedAt
  - Indexes: status, reporterId, targetType+targetId
  - Date:
  - Notes:

### 1F: Settings

- [ ] **1.21** Create `Setting` model
  - Fields: key(unique), value(JSONB), category, description, updatedBy
  - Date:
  - Notes:

- [ ] **1.22** Run `prisma migrate dev` — generate migration
  - Date:
  - Notes:

- [ ] **1.23** Run `prisma generate` — regenerate client
  - Date:
  - Notes:

---

## Phase 2 — Permission System & RBAC

> Replace role-based with permission-based access control.

- [ ] **2.1** Define `Permission` enum with all 16 permission strings
  - material.create, material.publish, material.archive, material.delete, material.read, material.download
  - teacher.verify, teacher.view_profile
  - discussion.comment, discussion.moderate, discussion.lock
  - analytics.view_own, analytics.view_all
  - notification.send, settings.update, user.manage, user.delete, report.resolve, audit.view
  - Date:
  - Notes:

- [ ] **2.2** Create `RolePermission` join table
  - Fields: role(Role enum), permission(Permission enum)
  - Unique constraint: [role, permission]
  - Date:
  - Notes:

- [ ] **2.3** Update PermissionsGuard — check role → permissions → route requirement
  - Read @Permissions() metadata via Reflector
  - Look up user's role → permissions from RolePermission table
  - Check if required permission is in user's permission set
  - Date:
  - Notes:

- [ ] **2.4** Seed default role-permission mappings
  - SUPER_ADMIN: all permissions
  - ADMIN: material.*, teacher.verify, discussion.*, analytics.view_all, notification.send, user.manage, report.resolve, audit.view
  - TEACHER: material.create, material.publish, material.archive, material.delete (own), material.read, discussion.comment, analytics.view_own, teacher.view_profile
  - STUDENT: material.read, material.download, discussion.comment, analytics.view_own, teacher.view_profile
  - Date:
  - Notes:

- [ ] **2.5** Add @Permissions() decorators to all controllers
  - Auth controller: public routes stay @Public, protected routes get permissions
  - Users controller: user.manage, user.delete
  - Material controller: material.*
  - Discussion controller: discussion.*
  - etc.
  - Date:
  - Notes:

---

## Phase 3 — Teacher & Student Modules

> Profiles, verification, dashboards.

- [ ] **3.1** Create `TeachersModule` — profile CRUD, verification status, public profile
  - Controller, Service, DTOs (create-profile, update-profile, verify-teacher)
  - Endpoints: GET /teachers, GET /teachers/:id, POST /teachers/profile, PATCH /teachers/profile, POST /teachers/:id/verify
  - Date:
  - Notes:

- [ ] **3.2** Teacher verification flow
  - Student submits teacher profile → status PENDING
  - Admin reviews → approve (role upgraded to TEACHER) or reject
  - Emit `TeacherVerifiedEvent` on approval
  - Date:
  - Notes:

- [ ] **3.3** Create `StudentsModule` — profile CRUD, grade assignment
  - Controller, Service, DTOs
  - Endpoints: GET /students/me, PATCH /students/me, POST /students/profile
  - Date:
  - Notes:

- [ ] **3.4** Teacher dashboard endpoint
  - GET /teachers/dashboard
  - Return: totalMaterials, totalViews, totalDownloads, totalBookmarks, totalLikes, completionRate, followerCount, topMaterials[]
  - Date:
  - Notes:

- [ ] **3.5** Student dashboard endpoint
  - GET /students/dashboard
  - Return: totalReadingTime, totalBookmarks, totalDownloads, continueReading[], recentHistory[]
  - Date:
  - Notes:

---

## Phase 4 — Material System (Core)

> The heart of the platform.

- [ ] **4.1** Create `SubjectsModule` — CRUD (admin), list (public)
  - Controller, Service, DTOs
  - Endpoints: GET /subjects, GET /subjects/:id, POST /subjects, PATCH /subjects/:id, DELETE /subjects/:id
  - Cache: subject list in Redis
  - Date:
  - Notes:

- [ ] **4.2** Create `GradesModule` — CRUD (admin), list (public)
  - Same structure as SubjectsModule
  - Date:
  - Notes:

- [ ] **4.3** Create `CategoriesModule` — nested hierarchy
  - Controller, Service, DTOs
  - Support tree structure (parentId)
  - Endpoints: GET /categories (tree), GET /categories/:id, POST /categories, PATCH /categories/:id, DELETE /categories/:id
  - Date:
  - Notes:

- [ ] **4.4** Create `TagsModule` — create on-demand, usage counter
  - Endpoints: GET /tags, POST /tags, GET /tags/:id/materials
  - Auto-increment usageCount when tag is attached to material
  - Date:
  - Notes:

- [ ] **4.5** Create `MaterialsModule` — full CRUD
  - Controller, Service, DTOs (create, update, query)
  - Endpoints: GET /materials, GET /materials/:id, POST /materials, PATCH /materials/:id, DELETE /materials/:id
  - Ownership check: teacher can only edit own materials
  - Date:
  - Notes:

- [ ] **4.6** Material status workflow (state machine)
  - DRAFT → PENDING (teacher submits for review)
  - PENDING → PUBLISHED (admin approves)
  - PENDING → DRAFT (admin rejects)
  - PUBLISHED → ARCHIVED (teacher/admin archives)
  - ARCHIVED → PUBLISHED (admin re-publishes)
  - Enforce transitions in service, emit events on status change
  - Date:
  - Notes:

- [ ] **4.7** Material file upload integration
  - POST /materials/:id/files — attach files
  - DELETE /materials/:id/files/:fileId — remove file
  - Use existing FileUpload + StorageService
  - Create MaterialFile records
  - Date:
  - Notes:

- [ ] **4.8** Material search
  - GET /materials?search=...&subject=...&grade=...&category=...&tag=...&teacher=...&type=...
  - PostgreSQL full-text search on title + description
  - Filter by all taxonomy fields
  - Pagination + sorting
  - Date:
  - Notes:

- [ ] **4.9** Material download
  - GET /materials/:id/download
  - Increment downloadCount
  - Create Activity(DOWNLOAD)
  - Serve file via StorageService
  - Date:
  - Notes:

- [ ] **4.10** Material online reading
  - GET /materials/:id/read
  - Stream content (PDF viewer URL or inline)
  - Track reading progress via ReadingProgress module
  - Date:
  - Notes:

---

## Phase 5 — Social Features

> Engagement layer.

- [ ] **5.1** Create `CommentsModule`
  - Endpoints: GET /materials/:id/comments, POST /materials/:id/comments, DELETE /comments/:id, POST /comments/:id/report
  - Nested replies with depth limit (configurable, default 3)
  - Self-referential parentId
  - Date:
  - Notes:

- [ ] **5.2** Create `ReactionsModule`
  - POST /reactions/toggle — toggle like on material or comment
  - Body: { targetType: 'MATERIAL'|'COMMENT', targetId: string }
  - Update likeCount on target (Material or Comment)
  - Date:
  - Notes:

- [ ] **5.3** Create `BookmarksModule`
  - POST /bookmarks — add bookmark
  - DELETE /bookmarks/:materialId — remove
  - GET /bookmarks — list my bookmarks (paginated)
  - Update bookmarkCount on Material
  - Date:
  - Notes:

- [ ] **5.4** Create `ReadingProgressModule`
  - POST /reading-progress — create or update progress
  - GET /reading-progress/:materialId — get progress for material
  - GET /reading-progress — list all my progress (paginated)
  - GET /reading-progress/continue-reading — top 10 incomplete, ordered by lastReadAt
  - Date:
  - Notes:

---

## Phase 6 — Activity & Analytics

> Event-driven tracking and dashboards.

- [ ] **6.1** Create `ActivityModule` — log every meaningful action
  - Service: `logActivity(userId, action, targetType, targetId, metadata, ip, ua)`
  - Called from every relevant controller action
  - Date:
  - Notes:

- [ ] **6.2** Define event classes
  - `MaterialPublishedEvent` — materialId, teacherId, subjectId
  - `MaterialArchivedEvent` — materialId, teacherId
  - `CommentCreatedEvent` — commentId, materialId, userId
  - `TeacherVerifiedEvent` — teacherId, verifiedBy
  - `UserRegisteredEvent` — userId, role
  - `ReportResolvedEvent` — reportId, resolvedBy, resolution
  - Files: `src/common/events/`
  - Date:
  - Notes:

- [ ] **6.3** Create event listeners
  - `NotificationListener` — on MaterialPublished, CommentCreated, TeacherVerified, ReportResolved → create notification
  - `AnalyticsListener` — on any event → update aggregate counts
  - `AuditListener` — on any event → create audit log entry
  - `SearchIndexListener` — on MaterialPublished/Archived → index/remove from search
  - Files: `src/modules/*/listeners/`
  - Date:
  - Notes:

- [ ] **6.4** Create `AnalyticsService` — aggregate from activity table
  - queryActivity(userId?, action?, targetType?, from?, to?)
  - countByAction(action, filters)
  - groupByTimeDimension(action, dimension: 'day'|'week'|'month', filters)
  - Date:
  - Notes:

- [ ] **6.5** Teacher analytics endpoint
  - GET /analytics/teacher
  - Metrics: totalMaterials, totalViews, totalDownloads, totalBookmarks, totalLikes, completionRate, followerCount, topMaterials (by views)
  - Date range filter
  - Date:
  - Notes:

- [ ] **6.6** Student analytics endpoint
  - GET /analytics/student
  - Metrics: totalReadingTime, totalBookmarks, totalDownloads, continueReading, recentHistory
  - Date:
  - Notes:

- [ ] **6.7** Admin analytics endpoint
  - GET /analytics/admin
  - Metrics: totalUsers, totalTeachers, totalMaterials, totalStorageUsed, dailyActiveUsers, popularSubjects[], popularTeachers[], trendingMaterials[]
  - Date range filter
  - Date:
  - Notes:

---

## Phase 7 — Search Abstraction

> Pluggable search backend.

- [ ] **7.1** Define `SearchService` interface
  - `search(query, filters, options): Promise<SearchResult>`
  - `indexDocument(entity, id, data): Promise<void>`
  - `removeDocument(id): Promise<void>`
  - File: `src/modules/search/search.interface.ts`
  - Date:
  - Notes:

- [ ] **7.2** Create `PostgresSearchProvider`
  - Implement SearchService using PostgreSQL full-text search
  - Use `tsvector`, `tsquery`, `plainto_tsquery`, `ts_rank`
  - Create GIN indexes on searchable columns
  - Date:
  - Notes:

- [ ] **7.3** Create `SearchModule` — register provider based on config
  - Dynamic module: select provider from env (POSTGRES, TYPESENSE, ELASTICSEARCH)
  - Config: `SEARCH_PROVIDER=postgres`
  - Date:
  - Notes:

- [ ] **7.4** Create search indices
  - Material: title + description (tsvector)
  - Teacher: firstName + lastName + bio
  - Subject: name + description
  - Category: name
  - Tag: name
  - Date:
  - Notes:

---

## Phase 8 — Notifications & Reports

> Notification delivery and content moderation.

- [ ] **8.1** Define notification types and payload schemas
  - MaterialPublished: { materialId, materialTitle, teacherName }
  - CommentReply: { commentId, materialId, replierName }
  - TeacherVerified: { teacherName }
  - MaterialApproved: { materialId, materialTitle }
  - ReportResolved: { reportId, resolution }
  - Announcement: { title, message }
  - Date:
  - Notes:

- [ ] **8.2** Wire notification triggers to event listeners
  - Connect NotificationListener (from Phase 6.3) to create notifications on events
  - Use existing NotificationsModule CRUD
  - Date:
  - Notes:

- [ ] **8.3** Create `ReportsModule`
  - Endpoints: POST /reports (report content), GET /reports (admin list), PATCH /reports/:id (resolve/dismiss)
  - Status workflow: PENDING → REVIEWED → RESOLVED | DISMISSED
  - Emit ReportResolvedEvent on resolution
  - Date:
  - Notes:

- [ ] **8.4** Content moderation admin queue
  - GET /admin/moderation/reports — pending reports with context
  - Bulk actions: resolve multiple, dismiss multiple
  - Auto-lock user after X reports
  - Date:
  - Notes:

---

## Phase 9 — Settings & Admin

> Platform configuration and admin tools.

- [ ] **9.1** Create `SettingsModule`
  - Endpoints: GET /settings, GET /settings/:key, PUT /settings/:key, GET /settings/category/:category
  - CRUD for platform settings (JSONB value)
  - Cache settings in Redis
  - SUPER_ADMIN only for write
  - Date:
  - Notes:

- [ ] **9.2** Admin dashboard endpoint
  - GET /admin/dashboard
  - Aggregate: totalUsers, totalTeachers, totalStudents, totalMaterials, totalStorageUsed, traffic (requests/day), dailyActiveUsers, pendingVerifications, pendingReports, popularSubjects[], popularTeachers[], trendingMaterials[]
  - Date:
  - Notes:

- [ ] **9.3** User management expansion
  - POST /admin/users/:id/verify-teacher — approve teacher verification
  - POST /admin/users/:id/suspend — suspend account
  - POST /admin/users/:id/unsuspend — reinstate account
  - Integrate with existing UsersModule
  - Date:
  - Notes:

- [ ] **9.4** Bulk operations
  - POST /admin/materials/bulk-approve — approve multiple pending materials
  - POST /admin/teachers/bulk-verify — verify multiple teachers
  - POST /admin/reports/bulk-resolve — resolve multiple reports
  - Date:
  - Notes:

---

## Phase 10 — Performance & Optimization

> Production readiness.

- [ ] **10.1** Cache popular materials in Redis
  - Cache top materials by subject, grade, overall
  - TTL: 5 minutes for trending, 1 hour for static data
  - Invalidate on material publish/archive
  - Date:
  - Notes:

- [ ] **10.2** Background jobs via BullMQ
  - Thumbnail generation job
  - Analytics aggregation job (hourly/daily)
  - Email delivery job
  - Webhook delivery job (replace fire-and-forget)
  - Date:
  - Notes:

- [ ] **10.3** Query optimization
  - Audit all service methods for N+1 queries
  - Use Prisma `include`/`select` properly
  - Add missing database indexes
  - Use `findMany` with `take`/`skip` instead of loading all
  - Date:
  - Notes:

- [ ] **10.4** Ensure pagination on all list endpoints
  - Verify every GET list endpoint uses PaginationQueryDto
  - Add sorting options
  - Add field selection where appropriate
  - Date:
  - Notes:

- [ ] **10.5** Configure Prisma connection pooling
  - Set `connection_limit` in DATABASE_URL
  - Configure `pool_timeout`
  - Monitor connection usage
  - Date:
  - Notes:

---

## Phase 11 — Testing & Documentation

> Quality and maintainability.

- [ ] **11.1** Unit tests — every service method
  - Target: 80%+ coverage on services
  - Mock PrismaService for unit tests
  - Date:
  - Notes:

- [ ] **11.2** Integration tests — module-level with real DB
  - Test full request lifecycle per module
  - Use test database (enterprise_db_test)
  - Date:
  - Notes:

- [ ] **11.3** E2E tests — full API flow
  - Auth flow: register → login → access protected → refresh → logout
  - Material flow: create → submit → approve → publish → search → download
  - Discussion flow: comment → reply → like → report
  - Admin flow: verify teacher → moderate report → update settings
  - Date:
  - Notes:

- [ ] **11.4** Swagger documentation — every endpoint
  - @ApiOperation with summary + description
  - @ApiResponse with examples
  - @ApiBearerAuth for protected routes
  - @ApiQuery for pagination/filter params
  - Date:
  - Notes:

- [ ] **11.5** Fill out Volume 4 API docs with actual endpoint specs
  - Replace stubs in `DOCS2/Volume_04_API_Specification/`
  - Document every endpoint request/response schema
  - Date:
  - Notes:

---

## Phase 12 — Deployment & DevOps

> Production deployment.

- [ ] **12.1** Docker production config (verify existing)
  - Multi-stage build ✓
  - Non-root user ✓
  - Health checks ✓
  - Verify all new modules work in container
  - Date:
  - Notes:

- [ ] **12.2** CI/CD pipeline (verify existing)
  - Lint + Build ✓
  - Test with PG service ✓
  - Docker build ✓
  - Add new test commands for education modules
  - Date:
  - Notes:

- [ ] **12.3** Environment configuration
  - Document all new env vars needed (SEARCH_PROVIDER, MAX_REPLY_DEPTH, etc.)
  - Update .env.example
  - Production secrets management
  - Date:
  - Notes:

- [ ] **12.4** Monitoring setup
  - Sentry DSN integration
  - Datadog APM integration
  - Custom metrics for material views, downloads, active users
  - Date:
  - Notes:

- [ ] **12.5** Log aggregation
  - Centralized Pino JSON logs
  - Structured fields: requestId, userId, action, duration
  - Log rotation strategy
  - Date:
  - Notes:

- [ ] **12.6** Database backup strategy
  - Automated daily backups
  - Point-in-time recovery
  - Backup verification
  - Date:
  - Notes:

---

## Quick Reference — Status Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[-]` | In progress |
| `[x]` | Completed |
| `[~]` | Blocked |

---

## Notes / Blockers

> Log any blockers, decisions, or important notes here.

```
- (none yet)
```
