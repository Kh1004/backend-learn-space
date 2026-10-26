# Development Rules — Education Content Platform

> **Every task in TASKS.md must follow these rules. No exceptions.**
> Last updated: 2026-07-23

---

## 1. Architecture Rules

| # | Rule |
|---|------|
| A1 | **Modular monolith only.** No microservices. No separate deployments. |
| A2 | **Every feature = one NestJS module** with controller, service, DTOs, and optionally guards/listeners. |
| A3 | **Controllers are thin.** Controllers handle HTTP only. No business logic, no DB queries. Delegate to services. |
| A4 | **Services own business logic.** All domain rules, validations, and orchestrations live in services. |
| A5 | **Never call Prisma directly from controllers.** Always go through a service. |
| A6 | **One service per domain concept.** `MaterialsService` for materials, `MaterialFileService` for files, `MaterialSearchService` for search. |
| A7 | **Inject dependencies via constructor.** Never create instances manually inside methods. |
| A8 | **`@Global()` modules only for cross-cutting concerns.** Feature modules are never global. |
| A9 | **Import only what you need.** Each module imports only its direct dependencies. |
| A10 | **Events for cross-module communication.** Module A should never inject Module B just to call one method. Emit an event. |

---

## 1B. Coding Principles (SOLID + Clean Code)

> These are non-negotiable. Every line of code must follow these.

| # | Principle | Rule |
|---|-----------|------|
| SOLID-1 | **Single Responsibility (SRP)** | One class, one job. `MaterialsService` handles materials only, not notifications, not analytics. If a service does two things, split it. |
| SOLID-2 | **Open/Closed (OCP)** | New features = new files, not editing existing ones. Add a new listener, don't modify the service. Add a new guard, don't add if-else in controllers. |
| SOLID-3 | **Liskov Substitution (LSP)** | If you create a `SearchProvider` interface, any implementation (Postgres, Typesense) must be interchangeable without breaking callers. |
| SOLID-4 | **Interface Segregation (ISP)** | Don't force a service to implement methods it doesn't use. Create `SearchProvider`, not `GodService` with 50 methods. |
| SOLID-5 | **Dependency Inversion (DIP)** | Depend on abstractions (interfaces), not concretions. Inject `SearchProvider` interface, not `PostgresSearchProvider` directly. |

| # | Principle | Rule |
|---|-----------|------|
| CC-1 | **DRY (Don't Repeat Yourself)** | If you write the same validation logic twice, extract it to a helper or pipe. If two services build the same query, extract to a shared method. |
| CC-2 | **KISS (Keep It Simple, Stupid)** | Prefer straightforward code over clever one-liners. If you need a comment to explain it, rewrite it. |
| CC-3 | **YAGNI (You Aren't Gonna Need It)** | Don't build "just in case" features. Build what TASKS.md requires. Future phases are future work. |
| CC-4 | **Fail Fast** | Validate inputs early. Throw exceptions at the boundary, not deep in the call stack. |
| CC-5 | **Immutability where possible** | Use `readonly` on injected services. Use `as const` for constants. Don't mutate function parameters. |
| CC-6 | **No magic strings/numbers** | Use enums, constants, or config values. Never `if (status === 'PUBLISHED')` — use `MaterialStatus.PUBLISHED`. |
| CC-7 | **Early returns** | Avoid deep nesting. Check error conditions first and return/throw, then handle the happy path. |
| CC-8 | **Composition over inheritance** | Use NestJS's module/service injection (composition) over class inheritance. |
| CC-9 | **Convention over configuration** | Follow existing patterns in the codebase. Don't invent new patterns when existing ones work. |
| CC-10 | **Boy Scout Rule** | When you touch a file, leave it better than you found it. Fix small issues while working on features. |

| # | Principle | Rule |
|---|-----------|------|
| TS-1 | **No `any` type** | Use `unknown` and narrow with type guards. `any` disables type checking. |
| TS-2 | **Use strict null checks** | Always handle `null`/`undefined`. Use `!` operator only when you're 100% certain. |
| TS-3 | **Prefer interfaces over type aliases** for object shapes | `interface Material { ... }` not `type Material = { ... }`. Interfaces merge and are more readable. |
| TS-4 | **Use enums for fixed sets** | `MaterialStatus.DRAFT` not `'DRAFT' as const`. |
| TS-5 | **Explicit return types** on public methods** | `async findOne(id: string): Promise<Material>` not `async findOne(id: string)`. |
| TS-6 | **Avoid type assertions** (`as`) unless unavoidable. Prefer type guards and narrowing. |
| TS-7 | **Use utility types** | `Pick<Material, 'id' | 'title'>`, `Omit<Material, 'password'>`, `Partial<CreateMaterialDto>` for update DTOs. |

| # | Principle | Rule |
|---|-----------|------|
| NF-1 | **No God Classes** | If a service has >200 lines, split it. If a file has >300 lines, it's doing too much. |
| NF-2 | **No God Functions** | If a method has >50 lines, extract helpers. If it has >5 parameters, use a DTO/options object. |
| NF-3 | **Consistent error handling** | Same exception type for same category of errors. Never mix `throw new Error()` with `throw new NotFoundException()`. |
| NF-4 | **No side effects in constructors** | NestJS constructors should only assign injected dependencies. No DB calls, no initialization logic. Use `onModuleInit()` for that. |
| NF-5 | **Prefer `async/await` over `.then()` chains** | `const user = await this.findOne(id)` not `this.findOne(id).then(u => ...)`. |
| NF-6 | **No console.log** | Always use the Logger service. `console.log` is not structured, not redacted, not configurable. |
| NF-7 | **Prefer `const` over `let`** | Default to `const`. Only use `let` when reassignment is necessary. Never use `var`. |
| NF-8 | **Use template literals for string interpolation** | `` `User ${id} created` `` not `'User ' + id + ' created'`. |
| NF-9 | **Destructure when accessing multiple properties** | `const { id, email } = user` not `user.id`, `user.email` repeated. |
| NF-10 | **Prefer array methods over loops** | `.filter()`, `.map()`, `.find()`, `.reduce()` over `for`/`while` when clarity is maintained. |

---

## 2. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case` | `create-material.dto.ts` |
| Classes | `PascalCase` | `CreateMaterialDto`, `MaterialsService` |
| Methods | `camelCase` | `findAll()`, `findOne()` |
| Constants | `UPPER_SNAKE_CASE` | `APP_CONSTANTS`, `MAX_REPLY_DEPTH` |
| Enums | `PascalCase` type, `UPPER_SNAKE` values | `MaterialStatus.PUBLISHED` |
| DB columns | `snake_case` via `@map` | `created_at`, `teacher_id` |
| DB tables | `snake_case` plural via `@map` | `materials`, `teacher_profiles` |
| API routes | `kebab-case` plural | `/api/v1/materials` |
| Permission strings | `resource.action` | `material.create` |
| Event classes | `PascalCase` + `Event` suffix | `MaterialPublishedEvent` |
| DTO classes | `{Verb}{Noun}Dto` | `CreateMaterialDto` |

---

## 3. File Structure

Every new module MUST follow this exact layout:

```
src/modules/<module-name>/
  <module-name>.module.ts
  <module-name>.controller.ts
  <module-name>.service.ts
  <module-name>.service.spec.ts
  dto/
    index.ts
    create-<entity>.dto.ts
    update-<entity>.dto.ts
    <entity>-query.dto.ts        # optional
  guards/                         # optional
    index.ts
  listeners/                      # optional
    <event-name>.listener.ts
```

---

## 4. Prisma Schema Rules

| # | Rule |
|---|------|
| P1 | **Every table** gets: `id` (UUID), `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `version`. |
| P2 | **Use `@map`** for snake_case column names, `@map` for table names. |
| P3 | **UUID primary keys** everywhere. Never auto-increment integers. |
| P4 | **Soft delete** via `deletedAt` field. Never hard delete user-facing data. |
| P5 | **Index every foreign key.** `@@index([foreignKey])` on every relation field. |
| P6 | **Index frequently filtered columns.** status, type, action, createdAt. |
| P7 | **Use enums** for fixed value sets. Never use plain strings for status/type fields. |
| P8 | **Use JSONB** for flexible metadata fields. |
| P9 | **Unique constraints** for natural keys. `@@unique([userId, materialId])` for bookmarks. |
| P10 | **Cascade rules:** User deletion cascades to sessions. Material deletion cascades to files/comments. |

---

## 5. DTO Rules

| # | Rule |
|---|------|
| D1 | **Every DTO gets `@ApiProperty` or `@ApiPropertyOptional`** for Swagger. |
| D2 | **Create DTOs use `@IsNotEmpty()`.** Update DTOs use `@IsOptional()` on everything. |
| D3 | **Validate all strings** with `@IsString()`, `@MaxLength()`. |
| D4 | **Validate all emails** with `@IsEmail()`. |
| D5 | **Validate all enums** with `@IsEnum()`. |
| D6 | **Password regex:** `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$` — min 8, max 128. |
| D7 | **Extend `PaginationQueryDto`** for all list query DTOs. |
| D8 | **Barrel export** all DTOs from `dto/index.ts`. |
| D9 | **No business logic in DTOs.** DTOs are data shapes only. |
| D10 | **One DTO per operation.** `CreateMaterialDto`, `UpdateMaterialDto`, `MaterialQueryDto`. |

---

## 6. Controller Rules

| # | Rule |
|---|------|
| C1 | **Always use `@ApiTags('ModuleName')`** on the controller class. |
| C2 | **Always use `@ApiBearerAuth()`** on the controller class. |
| C3 | **Always use `@ApiOperation({ summary: '...' })`** on every endpoint. |
| C4 | **Always use `@ApiResponse`** for every possible status code (200, 201, 400, 401, 403, 404, 409). |
| C5 | **Always use `@ApiParam`** for route parameters. |
| C6 | **Always use `@ApiQuery`** for query parameters on list endpoints. |
| C7 | **Use `@Public()`** for unauthenticated routes. Default is authenticated. |
| C8 | **Use `@Roles()`** or `@Permissions()` for authorization. |
| C9 | **Use `@Audit()`** on mutation endpoints (create, update, delete, approve, etc.). |
| C10 | **Use `@CurrentUser()`** to extract user from JWT payload. |
| C11 | **Use per-route rate limiting** `@Throttle()` on sensitive endpoints (login, register, forgot-password). |
| C12 | **Return the service method directly.** Controller does not transform data. |

---

## 7. Service Rules

| # | Rule |
|---|------|
| S1 | **Always inject `PrismaService`** via constructor. |
| S2 | **Always use `private readonly logger = new Logger(ServiceName.name)`** for logging. |
| S3 | **Always use `select`** to avoid returning password/hidden fields. |
| S4 | **Always use `buildSoftDeleteFilter()`** for queries that should exclude deleted records. |
| S5 | **Always use `buildSearchFilter()`** for text search queries. |
| S6 | **Always use `buildPaginatedResult()`** for paginated responses. |
| S7 | **Always use `buildPrismaQueryOptions()`** to convert PaginationQueryDto to Prisma options. |
| S8 | **Throw specific exceptions.** `NotFoundException`, `ConflictException`, `ForbiddenException`, `BadRequestException`. |
| S9 | **Use `PrismaService.$transaction()`** for multi-step writes that must be atomic. |
| S10 | **Use `this.logger.log()`** for important actions. Use `this.logger.warn()` for recoverable issues. Use `this.logger.error()` for failures. |
| S11 | **Never catch and swallow errors** unless you have a specific recovery strategy. |
| S12 | **Always check ownership** before allowing updates/deletes. Teacher can only modify own materials. |
| S13 | **Validate enum transitions.** Material status changes must follow the state machine. |
| S14 | **Emit events** after successful mutations. `EventEmitter.emit(new MaterialPublishedEvent(...))`. |

---

## 8. Module Rules

| # | Rule |
|---|------|
| M1 | **Module file goes in the module root.** `materials/materials.module.ts`. |
| M2 | **Export services** that other modules need to import. |
| M3 | **Import only required modules.** Don't import DatabaseModule explicitly (it's global). |
| M4 | **Register event listeners** in the module's `providers` array. |
| M5 | **Use `forwardRef()`** only if circular dependency is unavoidable. Prefer restructuring. |

---

## 9. Guard Rules

| # | Rule |
|---|------|
| G1 | **Global guards:** JwtAuthGuard, RolesGuard, ThrottlerGuard. Registered via `APP_GUARD`. |
| G2 | **Per-route guards:** PermissionsGuard, OwnershipGuard. Applied with `@UseGuards()`. |
| G3 | **Use `@Public()`** to skip authentication. Do not disable guards globally. |
| G4 | **Guards must be stateless.** No DB calls in guards unless cached. |
| G5 | **Permission checks** go through PermissionGuard reading `@Permissions()` metadata. |

---

## 10. Error Handling Rules

| # | Rule |
|---|------|
| E1 | **Use NestJS exceptions.** `NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`, `UnauthorizedException`. |
| E2 | **Never throw raw `Error()`.** Always use NestJS HTTP exceptions. |
| E3 | **Error messages must be human-readable.** `"Material not found"` not `"ERR_404"`. |
| E4 | **Use error codes** in the response for client-side handling. `errorCode: "MATERIAL_NOT_FOUND"`. |
| E5 | **Prisma error mapping:** P2002 -> ConflictException, P2025 -> NotFoundException, P2003 -> BadRequestException. |
| E6 | **Production mode hides stack traces.** The GlobalExceptionFilter handles this. |
| E7 | **Validation errors return field-level details** in the `details` array. |

---

## 11. Security Rules

| # | Rule |
|---|------|
| SEC1 | **Never return passwords** in API responses. Always use `select` excluding `password`. |
| SEC2 | **Never log passwords, tokens, or secrets.** The Logger redacts these automatically. |
| SEC3 | **Always hash passwords** with bcrypt before storing. Configurable rounds (default 12). |
| SEC4 | **JWT access tokens** expire in 15 minutes. Refresh tokens in 7 days. |
| SEC5 | **Refresh token rotation.** Every refresh invalidates the old token and issues a new pair. |
| SEC6 | **Rate limit sensitive endpoints.** Login/register: 5/60s. Forgot-password: 3/60s. |
| SEC7 | **Validate file uploads.** Check MIME type, file size, and extension. |
| SEC8 | **Use Helmet** for HTTP security headers. Already configured globally. |
| SEC9 | **Input validation via DTOs.** Whitelist mode strips unknown fields. ForbidNonWhitelisted rejects them. |
| SEC10 | **Account lockout** after 5 failed login attempts. 30-minute cooldown. |
| SEC11 | **HMAC-SHA256** for webhook payloads. |
| SEC12 | **Email enumeration prevention.** Forgot-password always returns the same message. |

---

## 12. Testing Rules

| # | Rule |
|---|------|
| T1 | **Unit test every service method.** Mock PrismaService. |
| T2 | **Test all happy paths and error paths.** Success, not found, conflict, unauthorized, forbidden. |
| T3 | **E2E test every API endpoint.** Full request lifecycle with real DB. |
| T4 | **Test authorization.** Verify STUDENT cannot access ADMIN endpoints. |
| T5 | **Test pagination.** Verify meta object is correct. |
| T6 | **Test soft delete.** Verify deleted records are excluded from queries. |
| T7 | **Test event emission.** Verify events are emitted on mutations. |
| T8 | **Use `@nestjs/testing`** module for all tests. |
| T9 | **Test file naming:** `<entity>.service.spec.ts` co-located with service. |
| T10 | **Target 80%+ coverage** on services. |

---

## 13. Event Rules

| # | Rule |
|---|------|
| EV1 | **One event class per meaningful action.** `MaterialPublishedEvent`, not `MaterialEvent`. |
| EV2 | **Event payload is a plain class.** No ORM entities in payloads. Use IDs and primitives. |
| EV3 | **Events are fire-and-forget.** Listeners must not throw exceptions that block the emitter. |
| EV4 | **Listeners are async.** Use `@OnEvent()` decorator from `@nestjs/event-emitter`. |
| EV5 | **One listener per concern.** NotificationListener handles notifications. AnalyticsListener handles analytics. |
| EV6 | **Event directory:** `src/common/events/` for event class definitions. |

---

## 14. Performance Rules

| # | Rule |
|---|------|
| PF1 | **Avoid N+1 queries.** Use Prisma `include` or `select` with relations. |
| PF2 | **Paginate everything.** No endpoint returns unbounded result sets. |
| PF3 | **Use `Promise.all()`** for independent DB queries. See `UsersService.findAll()`. |
| PF4 | **Cache hot data.** Popular materials, subjects, teacher profiles in Redis. |
| PF5 | **Use database indexes.** Every FK, every filtered column, every sorted column. |
| PF6 | **Background jobs for heavy work.** Thumbnail generation, analytics aggregation, email. |
| PF7 | **Connection pooling.** Configure Prisma `connection_limit` in DATABASE_URL. |
| PF8 | **Select only needed fields.** Never `findMany()` without `select` or `include`. |

---

## 15. Git & Commit Rules

| # | Rule |
|---|------|
| G1 | **Commit messages:** `<type>(<scope>): <description>` — e.g., `feat(materials): add CRUD endpoints` |
| G2 | **Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf` |
| G3 | **Never commit** `.env`, `node_modules`, `dist/`, or secrets. |
| G4 | **One logical change per commit.** Don't mix schema changes with feature code. |
| G5 | **Run `npm run lint`** before committing. Fix all errors. |
| G6 | **Run `npm run build`** before committing. Verify no type errors. |

---

## 16. Documentation & Comments Rules

| # | Rule |
|---|------|
| DOC1 | **Swagger on every endpoint.** Summary, description, responses, examples. |
| DOC2 | **README.md** stays updated with new modules and endpoints. |
| DOC3 | **Update TASKS.md** when a task is completed. Mark `[x]` with date. |
| DOC4 | **Update ROADMAP.md** if architecture decisions change. |
| DOC5 | **Comments explain WHY, not WHAT.** `// Lock after 5 attempts per security policy` not `// increment login attempts`. |
| DOC6 | **No commented-out code.** Delete it. Git keeps history. |
| DOC7 | **JSDoc on every public service method.** Describe purpose, params, returns, throws. |
| DOC8 | **TODO format:** `// TODO(author): description [TASK-ID]` — every TODO must have an owner and task reference. |
| DOC9 | **No stale comments.** If you change the code, update the comment or delete it. |
| DOC10 | **File-level header** on new files: `// Materials service — handles CRUD, status workflow, and search for educational materials.` |

---

## 17. Defensive Coding Rules (No Crash Code)

> Senior engineers write code that doesn't crash. Every edge case is handled.

| # | Rule |
|---|------|
| DEF1 | **Always check for null/undefined** before accessing properties. `if (!material) throw new NotFoundException()`. |
| DEF2 | **Always use try/catch** around async operations that can fail (DB calls, file operations, external APIs). Log the error, throw a meaningful exception. |
| DEF3 | **Never assume input is valid.** Validate at the boundary (DTOs). Don't trust client data even after validation. |
| DEF4 | **Always handle empty arrays/collections.** `if (materials.length === 0) return emptyResult` not `materials[0].title` (crashes). |
| DEF5 | **Always handle Prisma errors explicitly.** Wrap Prisma calls in try/catch and map P2002, P2025, P2003 to appropriate HTTP exceptions. |
| DEF6 | **Never let unhandled promise rejections propagate.** Every async call must be awaited or have `.catch()`. |
| DEF7 | **Always check array indices** before access. `if (arr.length > 0) { const first = arr[0]; }` |
| DEF8 | **Defensive parameter checks** at service method entry. `if (!id) throw new BadRequestException('ID is required')`. |
| DEF9 | **Never use `!` (non-null assertion) unless you've already validated** the value exists. Prefer null checks. |
| DEF10 | **Graceful degradation.** If cache fails, fall back to DB. If email fails, log and continue. Don't let one failure crash the whole request. |
| DEF11 | **Timeout external calls.** File operations, webhook delivery, email sending must have timeouts. Don't hang forever. |
| DEF12 | **Validate enum values** before using them. `if (!Object.values(MaterialStatus).includes(status)) throw new BadRequestException()`. |

---

## 18. No Hardcoded Values Rules

> Every magic string/number must be a constant, enum, or config value.

| # | Rule |
|---|------|
| HC1 | **No magic strings in code.** `'PUBLISHED'` is forbidden. Use `MaterialStatus.PUBLISHED`. |
| HC2 | **No magic numbers in code.** `5` (login attempts) is forbidden. Use `APP_CONSTANTS.AUTH.MAX_LOGIN_ATTEMPTS`. |
| HC3 | **No hardcoded URLs, emails, or paths.** Use config values from `@nestjs/config`. |
| HC4 | **No hardcoded timeouts.** Use `APP_CONSTANTS.WEBHOOKS.DELIVERY_TIMEOUT_MS`. |
| HC5 | **No hardcoded file sizes or MIME types.** Use `APP_CONSTANTS.FILE_UPLOAD.MAX_FILE_SIZE`. |
| HC6 | **No hardcoded rate limits.** Use `APP_CONSTANTS.SECURITY.RATE_LIMIT_MAX`. |
| HC7 | **No hardcoded error messages.** Use ErrorCode enum values for client-side matching. |
| HC8 | **All configurable values** go in `APP_CONSTANTS` or `ConfigModule`. |
| HC9 | **Magic strings in Prisma** (like column names) are OK via `@map`. But in TypeScript code, always use enums. |
| HC10 | **If you see a string repeated 3+ times**, extract it to a constant. |

---

## 19. No Duplicate Code Rules

> DRY is not a suggestion. It's a requirement.

| # | Rule |
|---|------|
| DRY1 | **Same validation logic twice** → extract to a custom validation pipe or helper function. |
| DRY2 | **Same Prisma query pattern twice** → extract to a shared query builder in `database/helpers/`. |
| DRY3 | **Same DTO shape twice** → create a base DTO and extend it. |
| DRY4 | **Same controller pattern twice** → extract to a base controller or shared decorator. |
| DRY5 | **Same select object twice** → define once as a constant (like `userSelect` in UsersService). |
| DRY6 | **Same error handling twice** → extract to a helper or use the GlobalExceptionFilter. |
| DRY7 | **Same business rule twice** → extract to a domain service or shared validator. |
| DRY8 | **Same test setup twice** → extract to a `beforeEach()` or test helper. |
| DRY9 | **Before writing new code**, search the codebase: `grep -r "similar pattern"`. If it exists, reuse it. |
| DRY10 | **If extracting would create a worse abstraction**, duplication is acceptable. DRY over orthodoxy. |

---

## 20. Senior Engineer Mindset

> How a senior engineer thinks while coding.

| # | Rule |
|---|------|
| SR1 | **Think about the next developer.** Your code will be read 100x more than written. Make it readable. |
| SR2 | **Think about failure first.** What happens if the DB is down? If the file doesn't exist? If the user is null? |
| SR3 | **Think about scale.** This query runs 100K times/day. Is it indexed? Is it efficient? |
| SR4 | **Think about security.** Can a user escalate privileges? Can they access another user's data? Can they inject SQL? |
| SR5 | **Think about maintainability.** Will this code make sense in 6 months? Can a new developer understand it in 5 minutes? |
| SR6 | **Think about edge cases.** Empty strings, zero values, maximum lengths, special characters, Unicode, concurrent requests. |
| SR7 | **Think about backwards compatibility.** Don't break existing API consumers. Use versioning. |
| SR8 | **Think about observability.** Can I debug this in production? Are there enough logs? Is the error message helpful? |
| SR9 | **Think about testing.** Can this function be unit tested? Is it mockable? Are there side effects? |
| SR10 | **Think before you code.** Understand the requirement. Understand the data model. Understand the existing code. Then write. |

---

## Quick Checklist Per Task

Before marking any task complete in TASKS.md, verify:

```
[ ] SOLID principles followed (SOLID-1 to SOLID-5)
[ ] Clean code principles followed (CC-1 to CC-10)
[ ] TypeScript best practices followed (TS-1 to TS-7)
[ ] No file/function bloat (NF-1 to NF-10)
[ ] Defensive coding — no crash-prone code (DEF1-DEF12)
[ ] No hardcoded values — all constants/enums (HC1-HC10)
[ ] No duplicate code — DRY enforced (DRY1-DRY10)
[ ] Senior mindset applied (SR1-SR10)
[ ] Prisma schema follows rules (P1-P10)
[ ] DTOs follow rules (D1-D10)
[ ] Controller follows rules (C1-C12)
[ ] Service follows rules (S1-S14)
[ ] Module follows rules (M1-M5)
[ ] Error handling follows rules (E1-E7)
[ ] Security follows rules (SEC1-SEC12)
[ ] Comments follow rules (DOC5-DOC10)
[ ] Unit tests written (T1-T3)
[ ] Events emitted where needed (EV1-EV6)
[ ] Performance checked (PF1-PF8)
[ ] Swagger documentation added (DOC1)
[ ] Lint passes: npm run lint
[ ] Build passes: npm run build
[ ] TASKS.md updated with [x] and date
```
