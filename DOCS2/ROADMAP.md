# Education Content Platform — Development Roadmap

> Consolidated from `Master Prompt.txt` + Volumes 1-5.
> Single source of truth for development phases, tasks, and status.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Language | TypeScript 5.7+ |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | JWT (access + refresh), Passport, sessions |
| Cache | Redis 7 (in-memory fallback) |
| Queue | BullMQ |
| Storage | Local filesystem (MinIO/S3 later) |
| API | REST, versioned `/api/v1/` |
| Docs | Swagger OpenAPI |
| Validation | class-validator + class-transformer |
| Logging | Pino (structured JSON) |
| Email | Nodemailer |
| Container | Docker + Docker Compose |
| Testing | Jest + Supertest |

---

## Current Codebase Status

### What's Already Built (Generic Enterprise Framework)

| Module | Status | Files |
|--------|--------|-------|
| **Auth** | Complete | JWT strategies, register/login/logout/refresh/password-reset/email-verify, session management |
| **Users** | Complete | CRUD, soft delete, RBAC (USER/ADMIN/SUPER_ADMIN) |
| **Audit** | Complete | AuditService, AuditInterceptor, @Audit decorator, query/filter |
| **Health** | Complete | DB + Redis health checks via @nestjs/terminus |
| **Feature Flags** | Complete | CRUD, toggle, key validation |
| **Notifications** | Complete | Basic CRUD, read/unread tracking |
| **Webhooks** | Complete | CRUD, HMAC-SHA256 signing, delivery logs |
| **File Upload** | Complete | Local storage, MIME validation, size limits |
| **Cache** | Complete | Dynamic module: Redis or in-memory |
| **Mail** | Complete | Nodemailer, verification + password reset emails |
| **Queue** | Scaffold only | BullMQ module imported, no processors |
| **Logger** | Complete | Pino with sensitive field redaction |
| **Common** | Complete | Guards, interceptors, filters, decorators, DTOs, utils, StorageService |

### What's NOT Built (Education Platform Domain)

| Domain | Status |
|--------|--------|
| TEACHER / STUDENT roles | Not built (only USER/ADMIN/SUPER_ADMIN) |
| TeacherProfile / StudentProfile | Not built |
| Material system | Not built |
| Subject / Grade / Category / Tag | Not built |
| Discussion / Comment / Reaction | Not built |
| Bookmark system | Not built |
| Reading Progress tracking | Not built |
| Activity event table | Not built |
| Analytics dashboards | Not built |
| Search abstraction | Not built |
| Event-driven architecture | EventEmitter imported, no events defined |
| Permission-based RBAC | PermissionsGuard exists, never used |
| Settings module | Not built |
| Reports module | Not built |
| Scheduler module | Not built |

---

## Development Phases

### Phase 0 — Foundation Fixes (Prerequisites)

> Fix gaps in the existing framework before building education features.

| # | Task | Details | Priority |
|---|------|---------|----------|
| 0.1 | **Expand Role enum** | Add `TEACHER`, `STUDENT` to Prisma `Role` enum. Keep `USER` for backward compat or remove if not needed. | High |
| 0.2 | **Add missing DB fields** | Add `createdBy`, `updatedBy`, `version` to all existing tables per Master Prompt spec | High |
| 0.3 | **Fix missing foreign keys** | Add Prisma `@relation` on `Notification.userId`, `WebhookLog.webhookId`, `FileUpload.uploadedBy`, `Webhook.createdBy` | High |
| 0.4 | **Enable PermissionsGuard** | Register globally or apply per-route. Define full permission matrix (see below) | High |
| 0.5 | **Wire EventBus** | Configure `@nestjs/event-emitter`. Define event classes. Register listeners | High |
| 0.6 | **Import QueueConfigModule** | Add to `app.module.ts` imports | Medium |
| 0.7 | **Register AuditInterceptor globally** | So @Audit works without manual @UseInterceptors | Medium |
| 0.8 | **Fix Redis health check** | Reuse shared Redis instance instead of creating new connection per check | Medium |
| 0.9 | **Enable noImplicitAny** | TypeScript strictness | Low |

---

### Phase 1 — Education Domain Models (Prisma Schema)

> Create all 23 entities. This is the foundation everything else depends on.

#### 1A: Core Identity Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `TeacherProfile` | Teacher-specific data | userId (FK), bio, specialization, isVerified, verifiedAt, verifiedBy, totalMaterials, followerCount |
| `StudentProfile` | Student-specific data | userId (FK), gradeId (FK), school, enrolledAt |

#### 1B: Content Taxonomy Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Subject` | Academic subjects | name, slug, description, icon, isActive, sortOrder |
| `Grade` | Grade levels | name, slug, sortOrder, isActive |
| `Category` | Content categories | name, slug, parentId (self-referential), icon, sortOrder |
| `Tag` | Free-form tags | name (unique), slug, usageCount |

#### 1C: Material System

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Material` | Unified content entity | title, description, teacherId (FK), subjectId, categoryId, gradeId, type (enum), status (enum), visibility (enum), language, thumbnailUrl, publishedAt, viewCount, downloadCount, likeCount, bookmarkCount, metadata (JSONB) |
| `MaterialTag` | Many-to-many | materialId, tagId |
| `MaterialFile` | Attached files | materialId (FK), fileUploadId (FK), sortOrder, isPrimary |

**MaterialType enum**: `PAST_PAPER`, `MODEL_PAPER`, `NOTE`, `BOOK`, `VIDEO`, `TUTORIAL`, `ASSIGNMENT`, `PRESENTATION`

**MaterialStatus enum**: `DRAFT`, `PENDING`, `PUBLISHED`, `ARCHIVED`

**MaterialVisibility enum**: `PUBLIC`, `PRIVATE`, `FOLLOWERS`, `GROUP`, `PREMIUM`

#### 1D: Social / Engagement Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Comment` | Discussion on material | materialId (FK), userId (FK), parentId (self-ref for replies), content, isReported, reportReason, depth |
| `Reaction` | Likes on materials/comments | userId, targetType (MATERIAL/COMMENT), targetId, type (LIKE) |
| `Bookmark` | Student bookmarks | userId (FK), materialId (FK), unique constraint |
| `ReadingProgress` | Per-material progress | userId (FK), materialId (FK), currentPage, progressPercent, readingTimeSeconds, lastReadAt, isCompleted |

#### 1E: Analytics / Activity Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Activity` | Generic event log | userId (FK), action (enum), targetType, targetId, metadata (JSONB), ipAddress, userAgent |
| `Report` | Content reports | reporterId (FK), targetType, targetId, reason, description, status (PENDING/REVIEWED/RESOLVED/DISMISSED), resolvedBy, resolvedAt |

**ActivityAction enum**: `VIEW`, `OPEN`, `READ`, `DOWNLOAD`, `BOOKMARK`, `LIKE`, `COMMENT`, `REPORT`, `FOLLOW`, `LOGIN`, `LOGOUT`, `SEARCH`

#### 1F: Settings Model

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Setting` | Platform settings | key (unique), value (JSONB), category, description, updatedBy |

---

### Phase 2 — Permission System & RBAC

> Replace hardcoded role checks with permission-based access control.

#### Permission Matrix

```
material.create        → TEACHER, ADMIN, SUPER_ADMIN
material.publish       → TEACHER (own), ADMIN, SUPER_ADMIN
material.archive       → TEACHER (own), ADMIN, SUPER_ADMIN
material.delete        → TEACHER (own), ADMIN, SUPER_ADMIN
material.read          → ALL
material.download      → STUDENT, TEACHER, ADMIN, SUPER_ADMIN

teacher.verify         → ADMIN, SUPER_ADMIN
teacher.view_profile   → ALL

discussion.comment     → STUDENT, TEACHER, ADMIN, SUPER_ADMIN
discussion.moderate    → ADMIN, SUPER_ADMIN
discussion.lock        → ADMIN, SUPER_ADMIN

analytics.view_own     → TEACHER, STUDENT
analytics.view_all     → ADMIN, SUPER_ADMIN

notification.send      → ADMIN, SUPER_ADMIN
settings.update        → SUPER_ADMIN
user.manage            → ADMIN, SUPER_ADMIN
user.delete            → SUPER_ADMIN
report.resolve         → ADMIN, SUPER_ADMIN
audit.view             → ADMIN, SUPER_ADMIN
```

#### Tasks

| # | Task | Details |
|---|------|---------|
| 2.1 | Define `Permission` enum with all strings above | Expand existing enum |
| 2.2 | Create `RolePermission` join table | role → permissions mapping |
| 2.3 | Update `RolesGuard` → `PermissionGuard` | Check user's role → permissions → route requirement |
| 2.4 | Seed default role-permission mappings | In seed.ts |
| 2.5 | Add @Permissions() to all education controllers | Replace @Roles() where fine-grained control needed |

---

### Phase 3 — Teacher & Student Modules

> Teacher verification, profiles, student profiles.

| # | Task | Details |
|---|------|---------|
| 3.1 | **TeachersModule** | Profile CRUD, verification status, public profile |
| 3.2 | **Teacher verification flow** | Student registers → submits profile → Admin verifies → role upgraded to TEACHER |
| 3.3 | **StudentsModule** | Profile CRUD, grade assignment, enrollment |
| 3.4 | **Teacher dashboard endpoint** | Own materials count, views, downloads, followers |
| 3.5 | **Student dashboard endpoint** | Reading time, bookmarks, continue-reading, history |

---

### Phase 4 — Material System (Core Feature)

> The heart of the platform. Build after Phase 1-3 are complete.

| # | Task | Details |
|---|------|---------|
| 4.1 | **SubjectsModule** | CRUD (admin only), list (public) |
| 4.2 | **GradesModule** | CRUD (admin only), list (public) |
| 4.3 | **CategoriesModule** | CRUD with nested hierarchy, list (public) |
| 4.4 | **TagsModule** | Create on-demand, usage counter, list |
| 4.5 | **MaterialsModule** | Full CRUD with status transitions |
| 4.6 | **Material status workflow** | DRAFT → PENDING (teacher submits) → PUBLISHED (admin approves) → ARCHIVED |
| 4.7 | **Material file upload** | Attach multiple files to material via MaterialFile |
| 4.8 | **Material search** | Full-text search on title, description. Filter by subject, grade, category, tag, teacher, type, status |
| 4.9 | **Material download** | Increment counter, create activity, serve file |
| 4.10 | **Material online reading** | Stream PDF/content, track reading progress |

#### Material Status State Machine

```
DRAFT ──────→ PENDING ──────→ PUBLISHED ──────→ ARCHIVED
  ↑               ↑               ↑
  │               │               │
  └── teacher ────┘── admin ──────┘── teacher/admin
      (edit)       (approve)       (archive)

PUBLISHED → DRAFT (admin rejects, back to draft)
ARCHIVED → PUBLISHED (admin re-publishes)
```

---

### Phase 5 — Social Features

> Engagement layer: comments, reactions, bookmarks, reading progress.

| # | Task | Details |
|---|------|---------|
| 5.1 | **CommentsModule** | Create, reply (nested with depth limit), delete own, report |
| 5.2 | **ReactionsModule** | Toggle like on material/comment, count updates |
| 5.3 | **BookmarksModule** | Add/remove/list bookmarks per student |
| 5.4 | **ReadingProgressModule** | Update progress, get continue-reading, history |

---

### Phase 6 — Activity & Analytics

> Event-driven tracking and dashboards.

| # | Task | Details |
|---|------|---------|
| 6.1 | **ActivityModule** | Log every meaningful action (VIEW, DOWNLOAD, BOOKMARK, etc.) |
| 6.2 | **Event definitions** | `MaterialPublishedEvent`, `CommentCreatedEvent`, `UserRegisteredEvent`, etc. |
| 6.3 | **Event listeners** | NotificationListener, AnalyticsListener, AuditListener, SearchIndexListener |
| 6.4 | **AnalyticsService** | Aggregate from activity table (not counters) |
| 6.5 | **Teacher analytics** | Materials, views, downloads, bookmarks, likes, completion, followers, top materials |
| 6.6 | **Student analytics** | Reading time, bookmarks, downloads, continue-reading, history |
| 6.7 | **Admin analytics** | Users, teachers, materials, storage, traffic, DAU, popular subjects/teachers, trending |

---

### Phase 7 — Search Abstraction

> Pluggable search backend.

| # | Task | Details |
|---|------|---------|
| 7.1 | **SearchService interface** | `search(query, filters)`, `index(entity)`, `remove(id)` |
| 7.2 | **PostgresSearchProvider** | PostgreSQL full-text search with `tsvector`, `tsquery`, ranking |
| 7.3 | **SearchModule** | Register provider based on config (postgres now, typesense later) |
| 7.4 | **Search indices** | Material title+description, teacher name, subject, category, tag |

---

### Phase 8 — Notifications & Reports

> Notification delivery and content moderation.

| # | Task | Details |
|---|------|---------|
| 8.1 | **Notification types** | MaterialPublished, CommentReply, TeacherVerified, MaterialApproved, ReportResolved, Announcement |
| 8.2 | **Notification triggers** | Wire to event listeners from Phase 6 |
| 8.3 | **ReportsModule** | Report material/comment, admin resolve/dismiss, status tracking |
| 8.4 | **Content moderation** | Admin queue for pending reports, bulk actions |

---

### Phase 9 — Settings & Admin

> Platform configuration and admin tools.

| # | Task | Details |
|---|------|---------|
| 9.1 | **SettingsModule** | CRUD platform settings (JSONB value), category grouping |
| 9.2 | **Admin dashboard** | Aggregate stats, recent activity, pending verifications, pending reports |
| 9.3 | **User management expansion** | Teacher verification, role upgrade, account suspension |
| 9.4 | **Bulk operations** | Bulk approve materials, bulk verify teachers |

---

### Phase 10 — Performance & Optimization

> Production readiness.

| # | Task | Details |
|---|------|---------|
| 10.1 | **Cache popular materials** | Redis cache for top materials, subjects, teacher profiles |
| 10.2 | **Background jobs via BullMQ** | Thumbnail generation, analytics aggregation, email delivery, webhook delivery |
| 10.3 | **Query optimization** | Eliminate N+1, use `include`/`select` properly, add missing indexes |
| 10.4 | **Pagination everywhere** | Ensure all list endpoints support pagination, sorting, filtering |
| 10.5 | **Database connection pooling** | Configure Prisma connection pool size |

---

### Phase 11 — Testing & Documentation

> Ensure quality and maintainability.

| # | Task | Details |
|---|------|---------|
| 11.1 | **Unit tests** | Every service method |
| 11.2 | **Integration tests** | Module-level tests with real DB |
| 11.3 | **E2E tests** | Full API flow tests for each module |
| 11.4 | **Swagger docs** | Every endpoint with summary, description, examples, auth requirements |
| 11.5 | **API documentation** | Fill out Volume 4 stubs with actual endpoint specs |

---

### Phase 12 — Deployment & DevOps

> Production deployment.

| # | Task | Details |
|---|------|---------|
| 12.1 | **Docker production** | Multi-stage build, non-root user, health checks (already done) |
| 12.2 | **CI/CD pipeline** | GitHub Actions: lint → test → docker build (already done) |
| 12.3 | **Environment config** | Production env vars, secrets management |
| 12.4 | **Monitoring** | Sentry/Datadog integration via monitoring.config |
| 12.5 | **Log aggregation** | Centralized logging with Pino JSON |
| 12.6 | **Database backups** | Automated backup strategy |

---

## Future Roadmap (Post-MVP)

| Phase | Features |
|-------|----------|
| **Phase 13** | Forums, Study Groups, Ratings |
| **Phase 14** | Courses, Lessons, Quizzes, Certificates |
| **Phase 15** | AI Tutor, OCR, Flashcards, Recommendation Engine |
| **Phase 16** | Subscriptions, Payments |
| **Phase 17** | Schools, Institutions |
| **Phase 18** | Live Classes, Video Streaming |
| **Phase 19** | Mobile push notifications, SMS |
| **Phase 20** | MinIO/S3 storage migration |

---

## Entity Relationship Summary

```
User ──┬── TeacherProfile
       ├── StudentProfile ──── Grade
       ├── Session
       ├── AuditLog
       ├── Activity
       ├── Bookmark ────────── Material
       ├── ReadingProgress ─── Material
       ├── Reaction ( polymorphic: Material | Comment )
       ├── Comment ─────────── Material
       │     └── Comment (self-ref: parentId)
       ├── Notification
       └── Report

Material ──┬── MaterialFile ──── FileUpload
            ├── MaterialTag ──── Tag
            ├── Subject
            ├── Category (self-ref: parentId)
            └── Grade

Setting (standalone)
FeatureFlag (standalone)
Webhook ──── WebhookLog
RolePermission (role → permissions mapping)
```

---

## Database Standards (Every Table)

```prisma
model Example {
  id        String   @id @default(uuid())
  // ... business fields ...

  // Audit fields (required on ALL tables)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_by")
  deletedAt DateTime? @map("deleted_at")
  createdBy String?  @map("created_by")
  updatedBy String?  @map("updated_by")
  version   Int      @default(1)

  @@map("examples")
}
```

---

## API Response Envelope (All Endpoints)

```jsonc
// Success
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "requestId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// Paginated
{
  "success": true,
  "statusCode": 200,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5, "hasNextPage": true, "hasPreviousPage": false },
  "requestId": "uuid",
  "timestamp": "..."
}

// Error
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errorCode": "VALIDATION_ERROR",
  "details": ["..."],
  "requestId": "uuid",
  "timestamp": "...",
  "path": "/api/v1/materials"
}
```

---

## Source Files Reference

| File | Purpose |
|------|---------|
| `DOCS2/Master Prompt.txt` | Full specification (940 lines) |
| `DOCS2/Volume_01_Product_Requirements/` | Product requirements (stubs) |
| `DOCS2/Volume_02_System_Architecture/` | Architecture design (stubs) |
| `DOCS2/Volume_03_Database_Design/` | Database design (stubs) |
| `DOCS2/Volume_04_API_Specification/` | API contracts (stubs) |
| `DOCS2/Volume_05_Backend_Implementation_Guide/` | Implementation guide (stubs) |
| `prisma/schema.prisma` | Current database schema (8 models) |
| `src/` | Current source code (12 modules) |
