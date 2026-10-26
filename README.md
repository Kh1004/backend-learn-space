# Education Content Platform (LMS Backend)

A production-ready LMS backend built with **NestJS 11**, **Prisma 5**, **PostgreSQL 16**, and **Redis 7**. Modular monolith supporting 100K+ users — teachers upload materials, students consume them.

## Features

### Core
- **Authentication** — JWT access/refresh tokens, registration, login, email verification, password reset, session tracking
- **Authorization** — RBAC with 5 roles (SUPER_ADMIN, ADMIN, TEACHER, STUDENT, USER), 25 permissions, global guards
- **Response System** — Standardized API responses, pagination metadata, request IDs, environment-aware error handling
- **Exception Handling** — Global exception filter with ThrottlerException, PrismaClientValidationError, Prisma error mapping, Sentry integration
- **Logging** — Structured JSON logging with Pino, sensitive data redaction, production log aggregation support
- **Audit System** — CRUD change tracking, security event logging, admin action audit trails

### Education Domain (25 Prisma models)
- **Subjects** — CRUD with slug, description, icon
- **Grades** — CRUD with level hierarchy
- **Categories** — Tree structure with parent/child relationships
- **Tags** — CRUD with slug, usage count
- **Materials** — Full CRUD with 8 types (NOTE, VIDEO, DOCUMENT, etc.), 3 visibility levels, publish/archive/restore workflow
- **Teacher Profiles** — Verification system, bio, qualifications
- **Student Profiles** — Grade level, enrollment date

### Discussion & Social
- **Comments** — CRUD with nested replies, pin/unpin, like, soft delete
- **Reports** — Content moderation with reason + status tracking
- **Bookmarks** — Toggle with user's bookmarked materials list
- **Likes** — Toggle with like count sync, check endpoint
- **Reading Progress** — Per-material progress tracking
- **Follows** — User follow/unfollow with follower/following counts

### Admin & Analytics
- **Settings** — Platform settings CRUD with category filter, bulk upsert, public endpoint
- **Activity** — User action logging and query
- **Analytics** — Teacher dashboard, student dashboard, admin dashboard aggregation
- **User Management** — CRUD, suspend/unsuspend, bulk verify/role-change/suspend operations

### Infrastructure
- **Cache** — Redis/in-memory via CacheService wrapper
- **Queue** — BullMQ with 3 processors (thumbnail, analytics, email)
- **Events** — EventEmitter2 wired into 6 services (auth, materials, bookmarks, comments, follows, likes)
- **Search** — PostgreSQL full-text search abstraction
- **File Upload** — Multer-based with metadata storage
- **Mail** — Nodemailer with template support (optional)
- **Health** — Database + Redis health checks via @nestjs/terminus

### Observability & DevOps
- **Sentry** — Error monitoring with @sentry/nestjs, DSN-based, disabled when unconfigured
- **Structured Logging** — Production JSON logs with service/hostname metadata, dev pino-pretty
- **DB Backup** — pg_dump script with gzip compression, retention cleanup
- **Docker** — Multi-stage Dockerfile, docker-compose.yml (app+postgres+redis), docker-compose.dev.yml
- **Swagger** — 26 tags, auto-generated OpenAPI docs at `/docs`

### Quality
- **276 unit tests** across 33 suites, all passing
- **E2E tests** for auth, RBAC, materials CRUD, comments, feature flags, notifications, webhooks, file upload, audit
- **TypeScript strict** — `noImplicitAny: true`, `strictNullChecks: true`
- **189 development rules** enforced (SOLID, clean code, defensive coding, no hardcoded values)

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Redis 7+ (optional)
- Docker & Docker Compose (optional)

### Setup

```bash
# Clone the repository
git clone <repo-url> my-project
cd my-project

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development databases
npm run docker:dev

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed the database
npm run prisma:seed

# Start development server
npm run start:dev
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@enterprise.com | Admin@123456 |
| Teacher | teacher@enterprise.com | Admin@123456 |
| Student | student@enterprise.com | Admin@123456 |
| User | user@enterprise.com | Admin@123456 |

### API Documentation

Once running, visit: `http://localhost:3000/docs`

## Project Structure

```
src/
├── common/                  # Shared infrastructure
│   ├── constants/           # App-wide constants (permissions, app constants)
│   ├── decorators/          # @Roles, @Public, @CurrentUser, @Audit, @ApiPaginatedResponse
│   ├── dtos/                # Shared DTOs (pagination)
│   ├── enums/               # Role (5), Permission (25), AuditAction, ErrorCode
│   ├── events/              # BaseEvent, material/user/activity events, listeners
│   ├── filters/             # Global exception filter (Throttler, Prisma, Http)
│   ├── guards/              # JwtAuthGuard, RolesGuard, PermissionsGuard
│   ├── interceptors/        # Response, logging, audit interceptors
│   ├── interfaces/          # JwtPayload, AuthenticatedRequest, PaginationMeta
│   ├── middleware/           # Request ID middleware
│   ├── pipes/               # Custom validation pipe
│   ├── services/            # CacheService (Redis/in-memory)
│   └── utils/               # hash, pagination, search helpers
├── config/                  # Type-safe config (app, auth, db, redis, mail, queue, monitoring)
├── database/                # PrismaService, DatabaseModule, query helpers, seeds
├── modules/
│   ├── auth/                # Register, login, logout, refresh, password reset, sessions
│   ├── users/               # CRUD, suspend/unsuspend, bulk admin operations
│   ├── health/              # Health checks (ping, database, Redis)
│   ├── audit/               # Audit log management
│   ├── cache/               # Cache configuration module
│   ├── mail/                # Email service
│   ├── queue/               # BullMQ (thumbnail, analytics, email processors)
│   ├── logger/              # Pino logger with structured logging
│   ├── subjects/            # Subject management
│   ├── grades/              # Grade level management
│   ├── categories/          # Category hierarchy (tree)
│   ├── tags/                # Tag management
│   ├── materials/           # Educational materials CRUD + publish/archive
│   ├── teachers/            # Teacher profiles + verification
│   ├── students/            # Student profiles
│   ├── comments/            # Comments + replies + pin + like
│   ├── reports/             # Content reports & moderation
│   ├── activity/            # User activity tracking
│   ├── analytics/           # Dashboard analytics (teacher/student/admin)
│   ├── bookmarks/           # Material bookmarks
│   ├── likes/               # Material likes toggle
│   ├── reading-progress/    # Reading progress tracking
│   ├── follows/             # User follow system
│   ├── search/              # Full-text search (PostgreSQL provider)
│   ├── settings/            # Platform settings (CRUD, bulk upsert, public)
│   ├── feature-flags/       # Feature flag management
│   ├── notifications/       # User notifications
│   ├── webhooks/            # Webhook management
│   └── file-upload/         # File upload & storage
├── app.module.ts            # Root module (18+ module imports)
├── instrument.ts            # Sentry initialization
└── main.ts                  # Bootstrap (Swagger, CORS, validation, versioning)
prisma/
├── schema.prisma            # 25 models, 6 enums
├── seed.ts                  # Database seeder
└── migrations/              # Database migrations
scripts/
├── generate-resource.sh     # Resource scaffolding
└── backup-db.sh             # Database backup with retention
test/
├── app.e2e-spec.ts          # E2E tests (auth, RBAC, materials, comments, etc.)
└── jest-e2e.json            # E2E test config
```

## API Endpoints (~101)

### Auth (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login | Public |
| POST | `/logout` | Logout | Bearer |
| POST | `/refresh` | Refresh tokens | Public |
| POST | `/change-password` | Change password | Bearer |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password | Public |
| POST | `/verify-email` | Verify email | Public |
| GET | `/sessions` | List active sessions | Bearer |
| DELETE | `/sessions/:id` | Revoke session | Bearer |
| GET | `/me` | Get current user | Bearer |

### Materials (`/api/v1/materials`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all materials | Public |
| GET | `/published` | List published materials | Public |
| GET | `/slug/:slug` | Get by slug | Public |
| GET | `/:id` | Get by ID | Public |
| POST | `/` | Create material | Teacher+ |
| PATCH | `/:id` | Update material | Teacher+ |
| DELETE | `/:id` | Soft delete | Teacher+ |
| POST | `/:id/publish` | Publish | Teacher+ |
| POST | `/:id/archive` | Archive | Teacher+ |
| POST | `/:id/restore` | Restore | Teacher+ |

### Comments (`/api/v1/comments`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/material/:materialId` | List comments for material | Public |
| GET | `/:id` | Get comment by ID | Public |
| POST | `/` | Create comment/reply | Bearer |
| PATCH | `/:id` | Edit comment | Owner/Admin |
| DELETE | `/:id` | Delete comment | Owner/Admin |
| POST | `/:id/pin` | Pin/unpin | Admin |
| POST | `/:id/like` | Like comment | Bearer |

### Other Modules

| Module | Endpoints | Key Features |
|--------|-----------|--------------|
| **Subjects** | 7 | CRUD, slug-based lookup |
| **Grades** | 7 | CRUD, level-based hierarchy |
| **Categories** | 8 | CRUD, tree structure |
| **Tags** | 7 | CRUD, usage count |
| **Teachers** | 6 | Profiles, verification |
| **Students** | 5 | Profiles, enrollment |
| **Reports** | 6 | Content moderation |
| **Bookmarks** | 3 | Toggle, user's bookmarks |
| **Likes** | 4 | Toggle, check, user/material likes |
| **Reading Progress** | 4 | Upsert, per-material progress |
| **Follows** | 4 | Toggle, follower/following lists |
| **Search** | 1 | Full-text search across materials |
| **Settings** | 9 | CRUD, category, public, bulk upsert |
| **Activity** | 4 | User action logging |
| **Analytics** | 3 | Teacher/Student/Admin dashboards |
| **Users** | 6 | CRUD, suspend, bulk admin ops |

## Configuration

All configuration managed via environment variables with type-safe config modules. See `.env.example`.

| Module | Toggle | Description |
|--------|--------|-------------|
| Redis | `REDIS_ENABLED` | Enable/disable Redis cache |
| Mail | `MAIL_ENABLED` | Enable/disable email sending |
| Queue | `QUEUE_ENABLED` | Enable/disable BullMQ queues |
| Sentry | `SENTRY_DSN` | Enable/disable error monitoring |
| Email Verification | `EMAIL_VERIFICATION_ENABLED` | Require email verification |

## Security

- **Helmet** — HTTP security headers
- **CORS** — Configurable cross-origin policy
- **Rate Limiting** — Throttler-based request limiting (429 with error code)
- **Password Hashing** — bcrypt with configurable salt rounds
- **JWT** — Short-lived access tokens (15m) + refresh token rotation (7d)
- **Input Validation** — class-validator with whitelist + forbidNonWhitelisted
- **Soft Deletes** — Data preservation with deletedAt
- **Sensitive Data Redaction** — Passwords, tokens, cookies redacted from logs
- **Account Locking** — Auto-lock after 5 failed login attempts
- **Role Protection** — Super Admin cannot be suspended
- **Prisma Error Mapping** — Unique constraint (409), foreign key (400), not found (404), validation (400)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in development mode |
| `npm run build` | Build for production |
| `npm run start:prod` | Start production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:seed` | Seed the database |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run docker:dev` | Start dev databases (PostgreSQL + Redis) |
| `npm run docker:up` | Start full production stack |
| `npm run docker:build` | Build Docker images |
| `npm run db:backup` | Backup database with retention cleanup |
| `npm run generate:resource` | Generate new CRUD resource |

## Docker

```bash
# Development databases only
npm run docker:dev

# Full production stack
npm run docker:up

# Build production image
npm run docker:build

# Backup database
BACKUP_RETENTION_DAYS=7 npm run db:backup
```

## Database Backup

```bash
# Backup to ./backups/ with 30-day retention (default)
npm run db:backup

# Custom backup path
./scripts/backup-db.sh /custom/backup/path

# Custom retention period
BACKUP_RETENTION_DAYS=7 npm run db:backup
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (ioredis) |
| Queue | BullMQ |
| Auth | JWT + Passport |
| Logging | Pino (nestjs-pino) |
| Monitoring | Sentry |
| Validation | class-validator |
| API Docs | Swagger/OpenAPI |
| Testing | Jest + Supertest |
| Container | Docker + Docker Compose |

## License

UNLICENSED
