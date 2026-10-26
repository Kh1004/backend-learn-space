# UI Developer Guide — Education Content Platform API

Complete reference for frontend developers consuming the LMS backend API.

**Base URL:** `http://localhost:3000/api/v1`
**Interactive Docs:** `http://localhost:3000/docs` (Swagger UI)

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Authentication](#2-authentication)
3. [Pagination & Filtering](#3-pagination--filtering)
4. [Error Handling](#4-error-handling)
5. [Enums Reference](#5-enums-reference)
6. [Auth Endpoints](#6-auth-endpoints)
7. [Users Endpoints](#7-users-endpoints)
8. [Materials Endpoints](#8-materials-endpoints)
9. [Comments Endpoints](#9-comments-endpoints)
10. [Subjects Endpoints](#10-subjects-endpoints)
11. [Grades Endpoints](#11-grades-endpoints)
12. [Categories Endpoints](#12-categories-endpoints)
13. [Tags Endpoints](#13-tags-endpoints)
14. [Teachers Endpoints](#14-teachers-endpoints)
15. [Students Endpoints](#15-students-endpoints)
16. [Bookmarks Endpoints](#16-bookmarks-endpoints)
17. [Likes Endpoints](#17-likes-endpoints)
18. [Reading Progress Endpoints](#18-reading-progress-endpoints)
19. [Follows Endpoints](#19-follows-endpoints)
20. [Reports Endpoints](#20-reports-endpoints)
21. [Notifications Endpoints](#21-notifications-endpoints)
22. [Search Endpoints](#22-search-endpoints)
23. [Settings Endpoints](#23-settings-endpoints)
24. [Feature Flags Endpoints](#24-feature-flags-endpoints)
25. [Analytics Endpoints](#25-analytics-endpoints)
26. [Activity Endpoints](#26-activity-endpoints)
27. [Audit Endpoints](#27-audit-endpoints)
28. [File Upload Endpoints](#28-file-upload-endpoints)
29. [Health Endpoints](#29-health-endpoints)
30. [Webhooks Endpoints](#30-webhooks-endpoints)

---

## 1. Getting Started

### Base URL

```
http://localhost:3000/api/v1
```

### Content Types

- **JSON endpoints:** `Content-Type: application/json`
- **File uploads:** `Content-Type: multipart/form-data`

### Authentication Header

All protected endpoints require:

```
Authorization: Bearer <accessToken>
```

### Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@enterprise.com | Admin@123456 |
| Teacher | teacher@enterprise.com | Admin@123456 |
| Student | student@enterprise.com | Admin@123456 |
| User | user@enterprise.com | Admin@123456 |

### Password Rules

All passwords must contain:
- At least 8 characters, max 128
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)
- One special character (@$!%*?&)

---

## 2. Authentication

### Auth Flow

```
Register → Login → Use accessToken in headers
                 → Use refreshToken to get new accessToken when expired
```

### Token Lifecycle

- **Access Token:** Expires in 15 minutes. Used in `Authorization: Bearer <token>` header.
- **Refresh Token:** Expires in 7 days. Used to get a new access token via `POST /auth/refresh`.
- **Sessions:** Each login creates a session. You can list and revoke sessions.

### How to Authenticate

**Step 1: Login**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@enterprise.com",
  "password": "Admin@123456"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "sessionId": "uuid-here",
    "user": {
      "id": "uuid",
      "email": "admin@enterprise.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "SUPER_ADMIN"
    }
  },
  "requestId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Step 2: Use the Access Token**

```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Step 3: Refresh When Expired**

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "new-access-token...",
    "refreshToken": "new-refresh-token..."
  }
}
```

---

## 3. Pagination & Filtering

### Query Parameters

All list endpoints accept these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number (min: 1) |
| `limit` | number | `20` | Items per page (max: 100) |
| `search` | string | — | Free text search |
| `sortBy` | string | `createdAt` | Field to sort by |
| `sortOrder` | string | `desc` | `asc` or `desc` |

### Example

```http
GET /api/v1/materials?page=2&limit=10&sortBy=title&sortOrder=asc&search=calculus
```

### Paginated Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    { "id": "...", "title": "...", "..." : "..." }
  ],
  "meta": {
    "page": 2,
    "limit": 10,
    "total": 85,
    "totalPages": 9,
    "hasNextPage": true,
    "hasPreviousPage": true
  },
  "requestId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 4. Error Handling

### Standard Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errorCode": "VAL_001",
  "details": [
    "email must be an email",
    "password is too short"
  ],
  "requestId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `AUTH_001` | 401 | Invalid credentials |
| `AUTH_002` | 403 | Account locked |
| `AUTH_003` | 403 | Account deactivated |
| `AUTH_004` | 401 | Invalid token |
| `AUTH_005` | 401 | Token expired |
| `AUTH_007` | 403 | Insufficient permissions |
| `VAL_001` | 400 | Validation error |
| `VAL_002` | 400 | Invalid input |
| `RES_001` | 404 | Resource not found |
| `RES_002` | 409 | Resource conflict |
| `DB_001` | 500 | Database error |
| `DB_002` | 409 | Unique constraint violation |
| `DB_003` | 400 | Foreign key constraint |
| `DB_004` | 404 | Record not found |
| `FILE_001` | 413 | File too large |
| `FILE_002` | 400 | Invalid file type |
| `RATE_001` | 429 | Rate limit exceeded |
| `SRV_001` | 500 | Internal server error |

### Common HTTP Status Codes

| Status | When |
|--------|------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation error |
| `401` | Not authenticated |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `409` | Conflict (duplicate, etc.) |
| `429` | Too many requests |
| `500` | Server error |

---

## 5. Enums Reference

### Role

```
USER | ADMIN | SUPER_ADMIN | TEACHER | STUDENT
```

### MaterialType

```
PAST_PAPER | MODEL_PAPER | NOTE | BOOK | VIDEO | TUTORIAL | ASSIGNMENT | PRESENTATION
```

### MaterialStatus

```
DRAFT | PENDING | PUBLISHED | ARCHIVED
```

### MaterialVisibility

```
PUBLIC | PRIVATE | FOLLOWERS | GROUP | PREMIUM
```

### ActivityType

```
VIEW | OPEN | READ | DOWNLOAD | BOOKMARK | LIKE | COMMENT | REPORT | FOLLOW | UNFOLLOW | LOGIN | LOGOUT | SEARCH
```

### CommentType

```
ROOT | REPLY
```

### ReportStatus

```
PENDING | REVIEWING | RESOLVED | DISMISSED
```

### VerificationStatus

```
PENDING | APPROVED | REJECTED
```

---

## 6. Auth Endpoints

### POST /auth/register

Register a new user account.

**Auth:** Public
**Rate Limit:** 5 requests per 60 seconds

**Request Body:**

```json
{
  "email": "john@example.com",        // required, valid email
  "password": "SecureP@ss123",        // required, 8-128 chars, complexity rules
  "firstName": "John",                // required, max 100 chars
  "lastName": "Doe"                   // required, max 100 chars
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "message": "Registration successful. Please verify your email.",
    "userId": "uuid"
  }
}
```

---

### POST /auth/login

Login with email and password.

**Auth:** Public
**Rate Limit:** 5 requests per 60 seconds

**Request Body:**

```json
{
  "email": "admin@enterprise.com",    // required
  "password": "Admin@123456"          // required
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "sessionId": "uuid",
    "user": {
      "id": "uuid",
      "email": "admin@enterprise.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "SUPER_ADMIN"
    }
  }
}
```

---

### POST /auth/logout

Logout and revoke session(s).

**Auth:** Bearer

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."  // optional — revokes all if omitted
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### POST /auth/refresh

Get new access + refresh tokens.

**Auth:** Public

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."  // required
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "new-access-token...",
    "refreshToken": "new-refresh-token..."
  }
}
```

---

### POST /auth/change-password

Change password (requires current password).

**Auth:** Bearer

**Request Body:**

```json
{
  "currentPassword": "OldP@ssw0rd",    // required
  "newPassword": "NewSecureP@ss123"    // required, complexity rules
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

### POST /auth/forgot-password

Request a password reset email.

**Auth:** Public
**Rate Limit:** 3 requests per 60 seconds

**Request Body:**

```json
{
  "email": "john@example.com"  // required
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "If an account exists, a password reset email will be sent"
  }
}
```

---

### POST /auth/reset-password

Reset password using token from email.

**Auth:** Public

**Request Body:**

```json
{
  "token": "a1b2c3d4e5f6...",          // required — from email
  "newPassword": "NewSecureP@ss123"    // required, complexity rules
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Password reset successful"
  }
}
```

---

### POST /auth/verify-email

Verify email using token from registration email.

**Auth:** Public

**Request Body:**

```json
{
  "token": "a1b2c3d4e5f6..."  // required — from email
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Email verified successfully"
  }
}
```

---

### GET /auth/sessions

List all active sessions for current user.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "session-uuid",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "127.0.0.1",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-01-08T00:00:00.000Z"
    }
  ]
}
```

---

### DELETE /auth/sessions/:id

Revoke a specific session.

**Auth:** Bearer
**Path Param:** `id` — session UUID

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Session revoked successfully"
  }
}
```

---

### GET /auth/me

Get current authenticated user profile.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "sub": "user-uuid",
    "email": "admin@enterprise.com",
    "role": "SUPER_ADMIN",
    "iat": 1700000000,
    "exp": 1700000900
  }
}
```

---

## 7. Users Endpoints

All user endpoints require admin role unless noted.

### GET /users

List all users (paginated).

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true,
      "isEmailVerified": false,
      "lastLoginAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 50, "totalPages": 3, "hasNextPage": true, "hasPreviousPage": false }
}
```

---

### GET /users/:id

Get a single user by ID.

**Auth:** ADMIN | SUPER_ADMIN
**Path Param:** `id` — user UUID

**Response (200):** Same shape as single item above.

---

### POST /users

Create a new user.

**Auth:** SUPER_ADMIN

**Request Body:**

```json
{
  "email": "newuser@example.com",       // required
  "password": "SecureP@ss123",          // required
  "firstName": "New",                   // required
  "lastName": "User",                   // required
  "role": "TEACHER"                     // optional, default: USER
}
```

**Response (201):** Created user object.

---

### PATCH /users/:id

Update a user.

**Auth:** ADMIN | SUPER_ADMIN
**Path Param:** `id` — user UUID

**Request Body (all optional):**

```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "role": "ADMIN",
  "isActive": false
}
```

**Response (200):** Updated user object.

---

### DELETE /users/:id

Soft-delete a user.

**Auth:** SUPER_ADMIN
**Path Param:** `id` — user UUID

**Response (200):**

```json
{ "success": true, "data": { "message": "User deleted successfully" } }
```

---

### POST /users/:id/restore

Restore a soft-deleted user.

**Auth:** SUPER_ADMIN

**Response (200):**

```json
{ "success": true, "data": { "message": "User restored successfully" } }
```

---

### POST /users/:id/suspend

Suspend a user account.

**Auth:** ADMIN | SUPER_ADMIN
**Note:** Cannot suspend SUPER_ADMIN accounts.

**Request Body:**

```json
{
  "reason": "Violation of terms",           // required, max 500 chars
  "suspendedUntil": "2024-12-31T23:59:59Z"  // optional, ISO-8601 date
}
```

**Response (200):**

```json
{ "success": true, "data": { "message": "User suspended successfully" } }
```

---

### POST /users/:id/unsuspend

Unsuspend a user account.

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):**

```json
{ "success": true, "data": { "message": "User unsuspended successfully" } }
```

---

### POST /users/bulk/verify

Bulk verify emails for multiple users.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]  // required, array of user UUIDs
}
```

---

### POST /users/bulk/role

Bulk update roles for multiple users.

**Auth:** SUPER_ADMIN

**Request Body:**

```json
{
  "ids": ["uuid-1", "uuid-2"],
  "role": "TEACHER"  // required
}
```

---

### POST /users/bulk/suspend

Bulk suspend multiple users.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "ids": ["uuid-1", "uuid-2"],
  "reason": "Violation"  // required
}
```

---

## 8. Materials Endpoints

### GET /materials

List all materials (public, paginated).

**Auth:** Public

**Query Params (additional):**

| Param | Type | Description |
|-------|------|-------------|
| `status` | MaterialStatus | Filter by status |
| `type` | MaterialType | Filter by type |
| `visibility` | MaterialVisibility | Filter by visibility |
| `authorId` | UUID | Filter by author |
| `categoryId` | UUID | Filter by category |
| `subjectId` | UUID | Filter by subject |
| `gradeId` | UUID | Filter by grade |
| `tagSlug` | string | Filter by tag slug |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Calculus 101 Study Guide",
      "slug": "calculus-101-study-guide",
      "description": "A comprehensive guide...",
      "type": "NOTE",
      "status": "PUBLISHED",
      "visibility": "PUBLIC",
      "language": "en",
      "viewCount": 142,
      "downloadCount": 23,
      "bookmarkCount": 15,
      "likeCount": 8,
      "commentCount": 3,
      "readingTime": 15,
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "metadata": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": "uuid",
        "firstName": "Teacher",
        "lastName": "Name",
        "email": "teacher@enterprise.com"
      },
      "category": {
        "id": "uuid",
        "name": "Mathematics",
        "slug": "mathematics"
      },
      "subjects": [
        { "subject": { "id": "uuid", "name": "Calculus", "slug": "calculus" } }
      ],
      "grades": [
        { "grade": { "id": "uuid", "name": "Grade 12", "slug": "grade-12", "level": 12 } }
      ],
      "tags": [
        { "tag": { "id": "uuid", "name": "math", "slug": "math" } }
      ],
      "files": [
        {
          "file": { "id": "uuid", "filename": "abc123.pdf", "originalName": "guide.pdf", "mimeType": "application/pdf", "size": 1048576, "url": "/files/abc123.pdf" },
          "isPrimary": true,
          "sortOrder": 0,
          "label": "Study Guide"
        }
      ]
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 50, "totalPages": 3, "hasNextPage": true, "hasPreviousPage": false }
}
```

---

### GET /materials/published

Get only published materials. Same response format as above.

**Auth:** Public

---

### GET /materials/slug/:slug

Get a material by its URL slug.

**Auth:** Public
**Path Param:** `slug` — material slug string (e.g., `calculus-101-study-guide`)

**Response (200):** Single material object (same shape as items above).

---

### GET /materials/:id

Get a material by ID. Emits a `MaterialViewedEvent` (increments view count).

**Auth:** Public
**Path Param:** `id` — material UUID

**Response (200):** Single material object.

---

### POST /materials

Create a new material.

**Auth:** TEACHER | ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "title": "Calculus 101 Study Guide",           // required, max 200 chars
  "description": "A comprehensive guide...",      // optional, max 2000 chars
  "content": "# Chapter 1\n\nFull markdown...",   // optional
  "type": "NOTE",                                 // optional, default: NOTE
  "visibility": "PUBLIC",                         // optional, default: PUBLIC
  "language": "en",                               // optional, default: "en"
  "categoryId": "uuid",                           // optional
  "thumbnailId": "uuid",                          // optional — file UUID
  "subjectIds": ["uuid-1", "uuid-2"],            // optional — array of subject UUIDs
  "gradeIds": ["uuid-1"],                         // optional — array of grade UUIDs
  "tagIds": ["uuid-1", "uuid-2"],               // optional — array of tag UUIDs
  "fileIds": ["uuid-1", "uuid-2"],              // optional — array of file UUIDs to attach
  "readingTime": 15,                              // optional — estimated minutes
  "metadata": { "key": "value" }                 // optional — arbitrary JSON
}
```

**Response (201):** Created material object (same shape as GET response).

---

### PATCH /materials/:id

Update a material. Only the author or admin can update.

**Auth:** TEACHER | ADMIN | SUPER_ADMIN
**Path Param:** `id` — material UUID

**Request Body (all optional):**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "content": "Updated content",
  "type": "VIDEO",
  "status": "PUBLISHED",
  "visibility": "PRIVATE",
  "language": "en",
  "categoryId": "uuid",
  "thumbnailId": "uuid",
  "subjectIds": ["uuid-1"],
  "gradeIds": ["uuid-1"],
  "tagIds": ["uuid-1"],
  "readingTime": 20,
  "metadata": {}
}
```

**Response (200):** Updated material object.

---

### DELETE /materials/:id

Soft-delete a material. Only the author or admin can delete.

**Auth:** TEACHER | ADMIN | SUPER_ADMIN

**Response (200):**

```json
{ "success": true, "data": { "message": "Material deleted successfully" } }
```

---

### POST /materials/:id/publish

Publish a draft material.

**Auth:** TEACHER | ADMIN | SUPER_ADMIN

**Response (200):** Material object with `status: "PUBLISHED"`.

---

### POST /materials/:id/archive

Archive a material.

**Auth:** TEACHER | ADMIN | SUPER_ADMIN

**Response (200):** Material object with `status: "ARCHIVED"`.

---

### POST /materials/:id/restore

Restore a soft-deleted material.

**Auth:** TEACHER | ADMIN | SUPER_ADMIN

**Response (200):**

```json
{ "success": true, "data": { "message": "Material restored successfully" } }
```

---

## 9. Comments Endpoints

### GET /comments/material/:materialId

List comments for a material (paginated).

**Auth:** Public
**Path Param:** `materialId` — material UUID
**Query Param:** `includeReplies` (boolean, optional)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Great explanation!",
      "type": "ROOT",
      "likeCount": 5,
      "isEdited": false,
      "isPinned": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "uuid",
        "firstName": "Student",
        "lastName": "Name"
      },
      "replies": [
        {
          "id": "uuid",
          "content": "I agree!",
          "type": "REPLY",
          "likeCount": 2,
          "isEdited": false,
          "isPinned": false,
          "createdAt": "2024-01-01T01:00:00.000Z",
          "updatedAt": "2024-01-01T01:00:00.000Z",
          "user": { "id": "uuid", "firstName": "Another", "lastName": "Student" }
        }
      ]
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false }
}
```

---

### GET /comments/:id

Get a single comment by ID.

**Auth:** Public

**Response (200):** Single comment object.

---

### POST /comments

Create a comment or reply.

**Auth:** Bearer

**Request Body:**

```json
{
  "materialId": "uuid",       // required — which material to comment on
  "parentId": "uuid",         // optional — parent comment UUID for replies
  "content": "Great material!" // required, max 5000 chars
}
```

**Response (201):** Created comment object.

---

### PATCH /comments/:id

Edit a comment. Only owner or admin can edit.

**Auth:** Bearer
**Path Param:** `id` — comment UUID

**Request Body:**

```json
{
  "content": "Updated comment text"  // required, max 5000 chars
}
```

**Response (200):** Updated comment object with `isEdited: true`.

---

### DELETE /comments/:id

Delete a comment. Only owner or admin can delete.

**Auth:** Bearer

**Response (200):**

```json
{ "success": true, "data": { "message": "Comment deleted successfully" } }
```

---

### POST /comments/:id/pin

Toggle pin on a comment. Admin only.

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):** Comment object with toggled `isPinned` value.

---

### POST /comments/:id/like

Like a comment (increments like count).

**Auth:** Bearer

**Response (200):** Comment object with incremented `likeCount`.

---

## 10. Subjects Endpoints

### GET /subjects

List all subjects.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Calculus",
      "slug": "calculus",
      "description": "Introduction to calculus",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /subjects/:id

Get a single subject.

**Auth:** Bearer

---

### POST /subjects

Create a subject.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "name": "Physics",              // required, max 100 chars
  "description": "Study of matter", // optional, max 500 chars
  "sortOrder": 1                   // optional
}
```

**Response (201):** Created subject object.

---

### PATCH /subjects/:id

Update a subject.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body (all optional):**

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "sortOrder": 2,
  "isActive": false
}
```

---

### DELETE /subjects/:id

Soft-delete a subject.

**Auth:** ADMIN | SUPER_ADMIN

---

### POST /subjects/:id/restore

Restore a soft-deleted subject.

**Auth:** SUPER_ADMIN

---

## 11. Grades Endpoints

### GET /grades

List all grades.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Grade 12",
      "slug": "grade-12",
      "level": 12,
      "description": "Final year",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /grades/:id

Get a single grade.

**Auth:** Bearer

---

### POST /grades

Create a grade.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "name": "Grade 10",     // required, max 100 chars
  "level": 10,            // required, integer >= 1
  "description": "..."    // optional, max 500 chars
}
```

---

### PATCH /grades/:id

Update a grade.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body (all optional):**

```json
{
  "name": "Updated Grade",
  "level": 11,
  "description": "Updated",
  "isActive": false
}
```

---

### DELETE /grades/:id

Soft-delete a grade.

**Auth:** ADMIN | SUPER_ADMIN

---

### POST /grades/:id/restore

Restore a soft-deleted grade.

**Auth:** SUPER_ADMIN

---

## 12. Categories Endpoints

### GET /categories

List all categories.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Mathematics",
      "slug": "mathematics",
      "description": "Math related materials",
      "parentId": null,
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /categories/tree

Get categories as a hierarchical tree.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Mathematics",
      "slug": "mathematics",
      "children": [
        {
          "id": "uuid",
          "name": "Algebra",
          "slug": "algebra",
          "children": []
        }
      ]
    }
  ]
}
```

---

### GET /categories/:id

Get a single category.

**Auth:** Bearer

---

### POST /categories

Create a category.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "name": "Algebra",            // required, max 100 chars
  "description": "...",         // optional, max 500 chars
  "parentId": "uuid",          // optional — for nested categories
  "sortOrder": 1                // optional
}
```

---

### PATCH /categories/:id

Update a category.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body (all optional):**

```json
{
  "name": "Updated Name",
  "description": "Updated",
  "parentId": "uuid",       // or null to make root
  "sortOrder": 2,
  "isActive": false
}
```

---

### DELETE /categories/:id

Soft-delete a category.

**Auth:** ADMIN | SUPER_ADMIN

---

### POST /categories/:id/restore

Restore a soft-deleted category.

**Auth:** SUPER_ADMIN

---

## 13. Tags Endpoints

### GET /tags

List all tags.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "calculus",
      "slug": "calculus",
      "usageCount": 15,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /tags/:id

Get a single tag.

**Auth:** Bearer

---

### POST /tags

Create a tag.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "name": "physics"  // required, max 50 chars
}
```

---

### PATCH /tags/:id

Update a tag.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "name": "updated-tag"  // optional, max 50 chars
}
```

---

### DELETE /tags/:id

Soft-delete a tag.

**Auth:** ADMIN | SUPER_ADMIN

---

### POST /tags/:id/restore

Restore a soft-deleted tag.

**Auth:** SUPER_ADMIN

---

## 14. Teachers Endpoints

### GET /teachers

List all teacher profiles (paginated).

**Auth:** Public

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "bio": "10 years teaching calculus",
      "institution": "MIT",
      "expertise": ["Calculus", "Linear Algebra"],
      "qualification": "PhD Mathematics",
      "yearsOfExperience": 10,
      "website": "https://example.com",
      "socialLinks": { "twitter": "@teacher" },
      "isVerified": true,
      "verifiedAt": "2024-01-01T00:00:00.000Z",
      "followerCount": 150,
      "materialCount": 25,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /teachers/:id

Get a single teacher profile.

**Auth:** Public

---

### POST /teachers

Create your teacher profile.

**Auth:** TEACHER
**Note:** Returns 409 if profile already exists.

**Request Body (all optional):**

```json
{
  "bio": "About me...",
  "institution": "University Name",
  "expertise": ["Topic 1", "Topic 2"],
  "qualification": "PhD in X",
  "yearsOfExperience": 5,
  "website": "https://mywebsite.com",
  "socialLinks": { "twitter": "@handle", "linkedin": "profile-url" }
}
```

---

### PATCH /teachers/:id

Update a teacher profile.

**Auth:** TEACHER | ADMIN | SUPER_ADMIN
**Note:** Only owner or admin.

---

### POST /teachers/:id/verify

Verify a teacher profile.

**Auth:** ADMIN | SUPER_ADMIN

---

### DELETE /teachers/:id

Delete a teacher profile.

**Auth:** TEACHER | ADMIN | SUPER_ADMIN

---

## 15. Students Endpoints

### GET /students

List all student profiles.

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "gradeId": "uuid",
      "institution": "High School X",
      "enrollmentYear": 2024,
      "interests": ["Math", "Physics"],
      "readingGoal": 300,
      "totalReadTime": 1200,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /students/:id

Get a single student profile.

**Auth:** Bearer

---

### POST /students

Create your student profile.

**Auth:** STUDENT
**Note:** Returns 409 if profile already exists.

**Request Body (all optional):**

```json
{
  "gradeId": "uuid",
  "institution": "School Name",
  "enrollmentYear": 2024,
  "interests": ["Math", "Science"],
  "readingGoal": 300
}
```

---

### PATCH /students/:id

Update a student profile.

**Auth:** STUDENT | ADMIN | SUPER_ADMIN

---

### DELETE /students/:id

Delete a student profile.

**Auth:** STUDENT | ADMIN | SUPER_ADMIN

---

## 16. Bookmarks Endpoints

### GET /bookmarks

List current user's bookmarks.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "bookmark-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "material": {
        "id": "uuid",
        "title": "Calculus Guide",
        "slug": "calculus-guide",
        "type": "NOTE",
        "status": "PUBLISHED",
        "readingTime": 15,
        "viewCount": 100,
        "author": { "id": "uuid", "firstName": "Teacher", "lastName": "Name" },
        "category": { "id": "uuid", "name": "Math", "slug": "math" }
      }
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### POST /bookmarks

Toggle bookmark on a material.

**Auth:** Bearer

**Request Body:**

```json
{
  "materialId": "uuid"  // required
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "bookmarked": true  // true if bookmarked, false if unbookmarked
  }
}
```

---

### GET /bookmarks/check/:materialId

Check if current user bookmarked a material.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": { "bookmarked": true }
}
```

---

## 17. Likes Endpoints

### GET /likes/user/me

List current user's liked materials.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "like-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "material": {
        "id": "uuid",
        "title": "Physics Notes",
        "slug": "physics-notes",
        "type": "NOTE",
        "status": "PUBLISHED",
        "likeCount": 25,
        "author": { "id": "uuid", "firstName": "Teacher", "lastName": "Name" },
        "category": { "id": "uuid", "name": "Physics", "slug": "physics" }
      }
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /likes/material/:materialId

List all likes for a material.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "like-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "user": { "id": "uuid", "firstName": "Student", "lastName": "Name" }
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### POST /likes/material/:materialId/toggle

Toggle like on a material.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": { "liked": true }  // true if liked, false if unliked
}
```

---

### GET /likes/check/material/:materialId

Check if current user liked a material.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": { "liked": true }
}
```

---

## 18. Reading Progress Endpoints

### GET /reading-progress

List current user's reading progress.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "materialId": "uuid",
      "userId": "uuid",
      "currentPage": 15,
      "progressPercent": 60.5,
      "readingTime": 300,
      "isCompleted": false,
      "completedAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /reading-progress/material/:materialId

Get reading progress for a specific material.

**Auth:** Bearer

**Response (200):** Single progress object or null.

---

### POST /reading-progress

Create or update reading progress (upsert).

**Auth:** Bearer

**Request Body:**

```json
{
  "materialId": "uuid",           // required
  "currentPage": 15,              // required, integer >= 0
  "progressPercent": 60.5,        // required, 0-100
  "readingTime": 300,             // optional — in seconds
  "isCompleted": false            // optional
}
```

**Response (200):** Progress object.

---

### DELETE /reading-progress/material/:materialId

Delete reading progress for a material.

**Auth:** Bearer

---

## 19. Follows Endpoints

### POST /follows/:userId

Toggle follow on a user.

**Auth:** Bearer
**Note:** Cannot follow yourself (returns 403).

**Response (200):**

```json
{
  "success": true,
  "data": { "followed": true }  // true if followed, false if unfollowed
}
```

---

### GET /follows/:userId/followers

List a user's followers.

**Auth:** Bearer

**Response (200):** Paginated list of follower user objects.

---

### GET /follows/:userId/following

List who a user is following.

**Auth:** Bearer

**Response (200):** Paginated list of following user objects.

---

### GET /follows/check/:userId

Check if current user follows a specific user.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": { "following": true }
}
```

---

## 20. Reports Endpoints

### GET /reports

List all reports (admin).

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "materialId": "uuid",
      "reporterId": "uuid",
      "reason": "Inappropriate content",
      "description": "Contains offensive material",
      "status": "PENDING",
      "resolvedAt": null,
      "resolution": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /reports/material/:materialId

List reports for a specific material.

**Auth:** ADMIN | SUPER_ADMIN

---

### GET /reports/:id

Get a single report.

**Auth:** ADMIN | SUPER_ADMIN

---

### POST /reports

Submit a report for a material.

**Auth:** Bearer
**Note:** Returns 409 if you already have an open report for this material.

**Request Body:**

```json
{
  "materialId": "uuid",                      // required
  "reason": "Inappropriate content",         // required, max 100 chars
  "description": "Details about the issue"   // optional, max 2000 chars
}
```

**Response (201):** Created report object.

---

### PATCH /reports/:id/resolve

Resolve a report (admin).

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "resolution": "Content removed"  // optional, max 2000 chars
}
```

**Response (200):** Updated report with `status: "RESOLVED"`.

---

### PATCH /reports/:id/dismiss

Dismiss a report (admin).

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):** Updated report with `status: "DISMISSED"`.

---

## 21. Notifications Endpoints

### GET /notifications

List current user's notifications.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "SYSTEM",
      "title": "Welcome!",
      "message": "Welcome to the platform.",
      "data": { "link": "/dashboard" },
      "isRead": false,
      "readAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /notifications/unread-count

Get count of unread notifications.

**Auth:** Bearer

**Response (200):**

```json
{
  "success": true,
  "data": { "count": 5 }
}
```

---

### POST /notifications

Create a notification (admin).

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "userId": "uuid",                     // required — target user
  "type": "SYSTEM",                     // required, max 50 chars
  "title": "New Material Available",    // required, max 200 chars
  "message": "Check out the new course", // required, max 2000 chars
  "data": { "link": "/materials/uuid" } // optional — arbitrary JSON
}
```

**Response (201):** Created notification object.

---

### PATCH /notifications/:id/read

Mark a notification as read.

**Auth:** Bearer

---

### POST /notifications/read-all

Mark all notifications as read.

**Auth:** Bearer

---

## 22. Search Endpoints

### GET /search

Full-text search across materials.

**Auth:** Public

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | Yes | Search term |
| `types` | string | No | Comma-separated types (e.g., `material,subject`) |
| `page` | number | No | Page number |
| `limit` | number | No | Items per page |

**Example:**

```http
GET /api/v1/search?q=calculus&types=material&page=1&limit=10
```

**Response (200):** Paginated search results.

---

## 23. Settings Endpoints

### GET /settings

List all settings.

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "key": "site.name",
      "value": "Education Platform",
      "description": "The name of the platform",
      "category": "site",
      "isPublic": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /settings/public

Get public settings (no admin required).

**Auth:** Bearer

---

### GET /settings/category/:category

Get settings by category.

**Auth:** ADMIN | SUPER_ADMIN
**Path Param:** `category` — e.g., `site`, `auth`, `upload`

---

### GET /settings/:id

Get a single setting.

**Auth:** ADMIN | SUPER_ADMIN

---

### GET /settings/key/:key

Get a setting by its key.

**Auth:** ADMIN | SUPER_ADMIN

---

### POST /settings

Create a setting.

**Auth:** SUPER_ADMIN

**Request Body:**

```json
{
  "key": "site.name",                     // required, max 100 chars
  "value": "Education Platform",           // required, max 2000 chars
  "description": "Platform name",          // optional, max 500 chars
  "category": "site",                      // optional, max 50 chars
  "isPublic": true                         // optional
}
```

**Response (201):** Created setting object.

---

### PATCH /settings/:id

Update a setting.

**Auth:** SUPER_ADMIN

**Request Body (all optional):**

```json
{
  "value": "New Value",
  "description": "Updated description",
  "category": "site",
  "isPublic": false,
  "isActive": true
}
```

---

### POST /settings/bulk

Bulk upsert settings.

**Auth:** SUPER_ADMIN

**Request Body:**

```json
{
  "settings": [
    {
      "key": "site.name",
      "value": { "value": "New Platform Name" }
    },
    {
      "key": "auth.maxAttempts",
      "value": { "value": "5", "description": "Max login attempts" }
    }
  ]
}
```

---

### DELETE /settings/:id

Soft-delete a setting.

**Auth:** SUPER_ADMIN

---

### POST /settings/:id/restore

Restore a soft-deleted setting.

**Auth:** SUPER_ADMIN

---

## 24. Feature Flags Endpoints

### GET /feature-flags

List all feature flags.

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "key": "new-dashboard",
      "name": "New Dashboard",
      "description": "Enable new dashboard UI",
      "enabled": true,
      "metadata": { "rolloutPercentage": 50 },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /feature-flags/check?key=:key

Check if a feature flag is enabled.

**Auth:** Bearer
**Query Param:** `key` — flag key string

**Response (200):**

```json
{
  "success": true,
  "data": { "key": "new-dashboard", "enabled": true }
}
```

---

### GET /feature-flags/:id

Get a single feature flag.

**Auth:** ADMIN | SUPER_ADMIN

---

### POST /feature-flags

Create a feature flag.

**Auth:** SUPER_ADMIN

**Request Body:**

```json
{
  "key": "new-dashboard",                   // required, kebab-case (lowercase + digits + hyphens)
  "name": "New Dashboard",                  // required, max 200 chars
  "description": "Enable new UI",           // optional, max 500 chars
  "enabled": false,                         // optional, default: false
  "metadata": { "rolloutPercentage": 0 }    // optional — arbitrary JSON
}
```

---

### PATCH /feature-flags/:id

Update a feature flag.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body (all optional):**

```json
{
  "name": "Updated Name",
  "description": "Updated",
  "enabled": true,
  "metadata": { "rolloutPercentage": 100 }
}
```

---

### POST /feature-flags/:id/toggle

Toggle a feature flag's enabled state.

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):** Feature flag object with toggled `enabled` value.

---

### DELETE /feature-flags/:id

Delete a feature flag.

**Auth:** SUPER_ADMIN

---

## 25. Analytics Endpoints

### GET /analytics/teacher/:teacherId

Get teacher dashboard analytics.

**Auth:** Bearer
**Path Param:** `teacherId` — user UUID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalMaterials": 25,
    "publishedMaterials": 20,
    "totalViews": 1500,
    "totalLikes": 120,
    "totalComments": 45,
    "totalFollowers": 80,
    "recentMaterials": [...]
  }
}
```

---

### GET /analytics/student/:studentId

Get student dashboard analytics.

**Auth:** Bearer
**Path Param:** `studentId` — user UUID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalBookmarks": 15,
    "totalLikes": 30,
    "completedMaterials": 10,
    "totalReadingTime": 3600,
    "recentActivity": [...]
  }
}
```

---

### GET /analytics/admin

Get admin dashboard analytics.

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 500,
    "totalMaterials": 200,
    "totalComments": 1500,
    "activeUsers": 350,
    "recentRegistrations": [...]
  }
}
```

---

## 26. Activity Endpoints

### GET /activity

List all activity logs (admin).

**Auth:** ADMIN | SUPER_ADMIN

**Query Params (additional):**

| Param | Type | Description |
|-------|------|-------------|
| `action` | ActivityType | Filter by action type |
| `resourceType` | string | Filter by resource type |
| `userId` | UUID | Filter by user |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "action": "LIKE",
      "resourceType": "material",
      "resourceId": "uuid",
      "metadata": {},
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /activity/user/:userId

Get activity for a specific user.

**Auth:** Bearer

---

### GET /activity/:id

Get a single activity log.

**Auth:** ADMIN | SUPER_ADMIN

---

### POST /activity

Create an activity log entry.

**Auth:** Bearer

**Request Body:**

```json
{
  "action": "VIEW",                      // required — ActivityType enum
  "resourceType": "material",            // required, max 50 chars
  "resourceId": "uuid",                  // required
  "metadata": { "key": "value" }        // optional
}
```

---

## 27. Audit Endpoints

### GET /audit

List all audit logs (admin).

**Auth:** ADMIN | SUPER_ADMIN

**Query Params (additional):**

| Param | Type | Description |
|-------|------|-------------|
| `action` | string | e.g., `CREATE`, `UPDATE`, `DELETE`, `LOGIN` |
| `resource` | string | e.g., `User`, `Session`, `Material` |
| `userId` | UUID | Filter by user |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "CREATE",
      "resource": "Material",
      "resourceId": "uuid",
      "description": "Material created",
      "userId": "uuid",
      "requestId": "uuid",
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "uuid",
        "email": "teacher@enterprise.com",
        "firstName": "Teacher",
        "lastName": "Name"
      }
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /audit/:id

Get a single audit log.

**Auth:** ADMIN | SUPER_ADMIN

---

## 28. File Upload Endpoints

### GET /files

List current user's uploaded files.

**Auth:** Bearer

**Query Params (additional):**

| Param | Type | Description |
|-------|------|-------------|
| `mimeType` | string | Filter by MIME type (e.g., `image/png`) |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "filename": "abc123.pdf",
      "originalName": "my-document.pdf",
      "mimeType": "application/pdf",
      "size": 1048576,
      "storageKey": "uploads/abc123.pdf",
      "storageType": "local",
      "url": "/files/abc123.pdf",
      "uploadedBy": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /files/:id

Get file metadata by ID.

**Auth:** Bearer

---

### POST /files/upload

Upload a file.

**Auth:** Bearer
**Content-Type:** `multipart/form-data`

**Form Data:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | binary | The file to upload (max 10MB) |

**Allowed MIME Types:**

- `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- `application/pdf`
- `text/csv`, `application/json`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Example (cURL):**

```bash
curl -X POST http://localhost:3000/api/v1/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@./myfile.pdf"
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "filename": "abc123.pdf",
    "originalName": "myfile.pdf",
    "mimeType": "application/pdf",
    "size": 1048576,
    "storageKey": "uploads/abc123.pdf",
    "storageType": "local",
    "url": "/files/abc123.pdf",
    "uploadedBy": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### DELETE /files/:id

Delete an uploaded file.

**Auth:** Bearer

**Response (200):**

```json
{ "success": true, "data": { "message": "File deleted successfully" } }
```

---

## 29. Health Endpoints

### GET /health

Full health check (database + optional Redis).

**Auth:** Public

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "info": {
      "database": { "status": "up" },
      "redis": { "status": "up" }
    },
    "error": {},
    "details": {
      "database": { "status": "up" },
      "redis": { "status": "up" }
    }
  }
}
```

**Response (503):** When health check fails.

---

### GET /health/ping

Simple liveness check.

**Auth:** Public

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 1234.567
  }
}
```

---

## 30. Webhooks Endpoints

### GET /webhooks

List all webhooks.

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Order Events",
      "url": "https://example.com/webhook",
      "secret": "whsec_abc123...",
      "events": ["user.created", "material.published"],
      "isActive": true,
      "lastTriggeredAt": "2024-01-01T00:00:00.000Z",
      "failureCount": 0,
      "createdBy": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### GET /webhooks/:id

Get a single webhook (includes secret).

**Auth:** ADMIN | SUPER_ADMIN

---

### GET /webhooks/:id/logs

Get delivery logs for a webhook.

**Auth:** ADMIN | SUPER_ADMIN

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "webhookId": "uuid",
      "event": "user.created",
      "payload": { "..." : "..." },
      "statusCode": 200,
      "response": "OK",
      "success": true,
      "error": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "..." : "..." }
}
```

---

### POST /webhooks

Create a webhook.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body:**

```json
{
  "name": "Order Events",                          // required, max 200 chars
  "url": "https://example.com/webhook",            // required, valid URL
  "events": ["user.created", "material.published"], // required, array of strings
  "secret": "whsec_custom..."                      // optional — auto-generated if omitted
}
```

**Response (201):** Created webhook object (includes generated `secret`).

---

### PATCH /webhooks/:id

Update a webhook.

**Auth:** ADMIN | SUPER_ADMIN

**Request Body (all optional):**

```json
{
  "name": "Updated Webhook",
  "url": "https://new-url.com/webhook",
  "events": ["user.created"],
  "isActive": false
}
```

---

### DELETE /webhooks/:id

Delete a webhook.

**Auth:** SUPER_ADMIN

---

## Quick Reference: All Endpoints

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/auth/register` | Public | Register user |
| 2 | POST | `/auth/login` | Public | Login |
| 3 | POST | `/auth/logout` | Bearer | Logout |
| 4 | POST | `/auth/refresh` | Public | Refresh tokens |
| 5 | POST | `/auth/change-password` | Bearer | Change password |
| 6 | POST | `/auth/forgot-password` | Public | Request reset |
| 7 | POST | `/auth/reset-password` | Public | Reset password |
| 8 | POST | `/auth/verify-email` | Public | Verify email |
| 9 | GET | `/auth/sessions` | Bearer | List sessions |
| 10 | DELETE | `/auth/sessions/:id` | Bearer | Revoke session |
| 11 | GET | `/auth/me` | Bearer | Current user |
| 12 | GET | `/users` | Admin | List users |
| 13 | GET | `/users/:id` | Admin | Get user |
| 14 | POST | `/users` | SuperAdmin | Create user |
| 15 | PATCH | `/users/:id` | Admin | Update user |
| 16 | DELETE | `/users/:id` | SuperAdmin | Delete user |
| 17 | POST | `/users/:id/restore` | SuperAdmin | Restore user |
| 18 | POST | `/users/:id/suspend` | Admin | Suspend user |
| 19 | POST | `/users/:id/unsuspend` | Admin | Unsuspend user |
| 20 | POST | `/users/bulk/verify` | Admin | Bulk verify |
| 21 | POST | `/users/bulk/role` | SuperAdmin | Bulk role change |
| 22 | POST | `/users/bulk/suspend` | Admin | Bulk suspend |
| 23 | GET | `/materials` | Public | List materials |
| 24 | GET | `/materials/published` | Public | Published materials |
| 25 | GET | `/materials/slug/:slug` | Public | Get by slug |
| 26 | GET | `/materials/:id` | Public | Get material |
| 27 | POST | `/materials` | Teacher+ | Create material |
| 28 | PATCH | `/materials/:id` | Teacher+ | Update material |
| 29 | DELETE | `/materials/:id` | Teacher+ | Delete material |
| 30 | POST | `/materials/:id/publish` | Teacher+ | Publish |
| 31 | POST | `/materials/:id/archive` | Teacher+ | Archive |
| 32 | POST | `/materials/:id/restore` | Teacher+ | Restore |
| 33 | GET | `/comments/material/:id` | Public | List comments |
| 34 | GET | `/comments/:id` | Public | Get comment |
| 35 | POST | `/comments` | Bearer | Create comment |
| 36 | PATCH | `/comments/:id` | Bearer | Edit comment |
| 37 | DELETE | `/comments/:id` | Bearer | Delete comment |
| 38 | POST | `/comments/:id/pin` | Admin | Pin comment |
| 39 | POST | `/comments/:id/like` | Bearer | Like comment |
| 40 | GET | `/subjects` | Bearer | List subjects |
| 41 | GET | `/subjects/:id` | Bearer | Get subject |
| 42 | POST | `/subjects` | Admin | Create subject |
| 43 | PATCH | `/subjects/:id` | Admin | Update subject |
| 44 | DELETE | `/subjects/:id` | Admin | Delete subject |
| 45 | POST | `/subjects/:id/restore` | SuperAdmin | Restore subject |
| 46 | GET | `/grades` | Bearer | List grades |
| 47 | GET | `/grades/:id` | Bearer | Get grade |
| 48 | POST | `/grades` | Admin | Create grade |
| 49 | PATCH | `/grades/:id` | Admin | Update grade |
| 50 | DELETE | `/grades/:id` | Admin | Delete grade |
| 51 | POST | `/grades/:id/restore` | SuperAdmin | Restore grade |
| 52 | GET | `/categories` | Bearer | List categories |
| 53 | GET | `/categories/tree` | Bearer | Category tree |
| 54 | GET | `/categories/:id` | Bearer | Get category |
| 55 | POST | `/categories` | Admin | Create category |
| 56 | PATCH | `/categories/:id` | Admin | Update category |
| 57 | DELETE | `/categories/:id` | Admin | Delete category |
| 58 | POST | `/categories/:id/restore` | SuperAdmin | Restore category |
| 59 | GET | `/tags` | Bearer | List tags |
| 60 | GET | `/tags/:id` | Bearer | Get tag |
| 61 | POST | `/tags` | Admin | Create tag |
| 62 | PATCH | `/tags/:id` | Admin | Update tag |
| 63 | DELETE | `/tags/:id` | Admin | Delete tag |
| 64 | POST | `/tags/:id/restore` | SuperAdmin | Restore tag |
| 65 | GET | `/teachers` | Public | List teachers |
| 66 | GET | `/teachers/:id` | Public | Get teacher |
| 67 | POST | `/teachers` | Teacher | Create profile |
| 68 | PATCH | `/teachers/:id` | Teacher+ | Update profile |
| 69 | POST | `/teachers/:id/verify` | Admin | Verify teacher |
| 70 | DELETE | `/teachers/:id` | Teacher+ | Delete profile |
| 71 | GET | `/students` | Admin | List students |
| 72 | GET | `/students/:id` | Bearer | Get student |
| 73 | POST | `/students` | Student | Create profile |
| 74 | PATCH | `/students/:id` | Student+ | Update profile |
| 75 | DELETE | `/students/:id` | Student+ | Delete profile |
| 76 | GET | `/bookmarks` | Bearer | List bookmarks |
| 77 | POST | `/bookmarks` | Bearer | Toggle bookmark |
| 78 | GET | `/bookmarks/check/:id` | Bearer | Check bookmark |
| 79 | GET | `/likes/user/me` | Bearer | My likes |
| 80 | GET | `/likes/material/:id` | Bearer | Material likes |
| 81 | POST | `/likes/material/:id/toggle` | Bearer | Toggle like |
| 82 | GET | `/likes/check/material/:id` | Bearer | Check like |
| 83 | GET | `/reading-progress` | Bearer | My progress |
| 84 | GET | `/reading-progress/material/:id` | Bearer | Material progress |
| 85 | POST | `/reading-progress` | Bearer | Update progress |
| 86 | DELETE | `/reading-progress/material/:id` | Bearer | Delete progress |
| 87 | POST | `/follows/:userId` | Bearer | Toggle follow |
| 88 | GET | `/follows/:userId/followers` | Bearer | List followers |
| 89 | GET | `/follows/:userId/following` | Bearer | List following |
| 90 | GET | `/follows/check/:userId` | Bearer | Check follow |
| 91 | GET | `/reports` | Admin | List reports |
| 92 | GET | `/reports/material/:id` | Admin | Material reports |
| 93 | GET | `/reports/:id` | Admin | Get report |
| 94 | POST | `/reports` | Bearer | Submit report |
| 95 | PATCH | `/reports/:id/resolve` | Admin | Resolve report |
| 96 | PATCH | `/reports/:id/dismiss` | Admin | Dismiss report |
| 97 | GET | `/notifications` | Bearer | List notifications |
| 98 | GET | `/notifications/unread-count` | Bearer | Unread count |
| 99 | POST | `/notifications` | Admin | Create notification |
| 100 | PATCH | `/notifications/:id/read` | Bearer | Mark read |
| 101 | POST | `/notifications/read-all` | Bearer | Mark all read |
| 102 | GET | `/search?q=` | Public | Full-text search |
| 103 | GET | `/settings` | Admin | List settings |
| 104 | GET | `/settings/public` | Bearer | Public settings |
| 105 | GET | `/settings/category/:cat` | Admin | By category |
| 106 | GET | `/settings/:id` | Admin | Get setting |
| 107 | GET | `/settings/key/:key` | Admin | By key |
| 108 | POST | `/settings` | SuperAdmin | Create setting |
| 109 | PATCH | `/settings/:id` | SuperAdmin | Update setting |
| 110 | POST | `/settings/bulk` | SuperAdmin | Bulk upsert |
| 111 | DELETE | `/settings/:id` | SuperAdmin | Delete setting |
| 112 | POST | `/settings/:id/restore` | SuperAdmin | Restore setting |
| 113 | GET | `/feature-flags` | Admin | List flags |
| 114 | GET | `/feature-flags/check?key=` | Bearer | Check flag |
| 115 | GET | `/feature-flags/:id` | Admin | Get flag |
| 116 | POST | `/feature-flags` | SuperAdmin | Create flag |
| 117 | PATCH | `/feature-flags/:id` | Admin | Update flag |
| 118 | POST | `/feature-flags/:id/toggle` | Admin | Toggle flag |
| 119 | DELETE | `/feature-flags/:id` | SuperAdmin | Delete flag |
| 120 | GET | `/analytics/teacher/:id` | Bearer | Teacher analytics |
| 121 | GET | `/analytics/student/:id` | Bearer | Student analytics |
| 122 | GET | `/analytics/admin` | Admin | Admin analytics |
| 123 | GET | `/activity` | Admin | List activities |
| 124 | GET | `/activity/user/:id` | Bearer | User activities |
| 125 | GET | `/activity/:id` | Admin | Get activity |
| 126 | POST | `/activity` | Bearer | Create activity |
| 127 | GET | `/audit` | Admin | List audit logs |
| 128 | GET | `/audit/:id` | Admin | Get audit log |
| 129 | GET | `/files` | Bearer | List files |
| 130 | GET | `/files/:id` | Bearer | Get file |
| 131 | POST | `/files/upload` | Bearer | Upload file |
| 132 | DELETE | `/files/:id` | Bearer | Delete file |
| 133 | GET | `/health` | Public | Health check |
| 134 | GET | `/health/ping` | Public | Ping |
| 135 | GET | `/webhooks` | Admin | List webhooks |
| 136 | GET | `/webhooks/:id` | Admin | Get webhook |
| 137 | GET | `/webhooks/:id/logs` | Admin | Webhook logs |
| 138 | POST | `/webhooks` | Admin | Create webhook |
| 139 | PATCH | `/webhooks/:id` | Admin | Update webhook |
| 140 | DELETE | `/webhooks/:id` | SuperAdmin | Delete webhook |

---

**Total: 140 endpoints across 25 modules**
