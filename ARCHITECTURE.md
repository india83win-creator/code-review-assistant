# ARCHITECTURE.md — AI-Powered Code Review Assistant

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Design](#database-design)
5. [AI Integration Flow](#ai-integration-flow)
6. [Authentication & Security](#authentication--security)
7. [API Reference](#api-reference)

---

## System Overview

The AI-Powered Code Review Assistant is a full-stack web application that enables developers to upload source code, organise it into projects, and run structured AI-generated reviews across four modes: General, Security, Performance, and Code Quality. An integrated chat interface allows developers to ask natural-language questions about their codebase.

The system is built around a configurable AI provider model — users can connect any OpenAI-compatible endpoint including OpenAI, Google Gemini, Ollama (local), LM Studio, or a custom base URL, without any hardcoded provider logic in the codebase.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                      │
│              Next.js 16 · React 19 · TypeScript          │
└─────────────────────┬───────────────────────────────────┘
                      │  HTTP/REST (Axios)
                      │  Authorization: Bearer <JWT>
┌─────────────────────▼───────────────────────────────────┐
│                   FastAPI Backend                         │
│         SQLAlchemy ORM · Python-Jose · Passlib           │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────────────┐
│  PostgreSQL          │   │  AI Provider (configurable)  │
│  (Supabase)          │   │  OpenAI / Gemini / Ollama /  │
│                      │   │  LM Studio / Custom Endpoint │
└─────────────────────┘   └─────────────────────────────┘
```

---

## Frontend Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Axios · Lucide React

### Directory Structure

```
frontend/
└── app/
    ├── page.tsx                    # Public landing page
    ├── layout.tsx                  # Root layout — wraps ToastProvider
    ├── login/
    │   └── page.tsx                # Authentication — login
    ├── register/
    │   └── page.tsx                # Authentication — registration
    ├── dashboard/
    │   ├── page.tsx                # Main workspace — project list, activity feed
    │   └── projects/
    │       └── page.tsx            # Project workspace — files, reviews, chat
    ├── ai-settings/
    │   └── page.tsx                # AI provider configuration
    ├── about/
    │   └── page.tsx                # Developer profile
    └── components/
        ├── AppShell.tsx            # Collapsible sidebar navigation shell
        ├── ToastProvider.tsx       # Global notification context (Context API)
        └── AnimatedCounter.tsx     # Animated numeric counter (requestAnimationFrame)
```

### Routing & Navigation

All routes under `/dashboard` are protected. On mount, each page checks `localStorage` for a valid JWT token and redirects unauthenticated users to `/login`. Navigation is handled via Next.js `useRouter` and `usePathname`.

### State Management

No external state library is used. State is managed at the component level using React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`). Global notification state is provided via a custom `ToastProvider` context.

### API Communication

All API calls are made with Axios to `https://code-review-assistant-api-i4ws.onrender.com/api`. The JWT token is retrieved from `localStorage` and attached as `Authorization: Bearer <token>` on every request. AI provider settings (base URL, API key, model name) are read from the user profile and included in review and chat request bodies, keeping the backend stateless with respect to provider configuration.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| App Router with `'use client'` pages | All pages require user interaction and real-time state; no benefit from RSC for this use case |
| `Promise.allSettled` for dashboard enrichment | Ensures a single failed file/review fetch does not abort the entire project list render |
| AI settings sent per-request | Enables instant provider switching without re-authentication or server-side session mutation |
| `localStorage` for onboarding state | Lightweight persistence for a UI-only preference; no database record warranted |

---

## Backend Architecture

**Stack:** FastAPI · SQLAlchemy 2 · PostgreSQL (Supabase) · Python-Jose · Passlib/bcrypt · OpenAI Python SDK

### Directory Structure

```
backend/
└── app/
    ├── main.py                     # Application entrypoint — CORS, router registration, startup hooks
    ├── database.py                 # SQLAlchemy engine, SessionLocal, Base, get_db dependency
    ├── models/
    │   ├── __init__.py
    │   ├── user.py                 # User model — credentials, role, AI provider settings
    │   ├── project.py              # Project model
    │   ├── file.py                 # File model — filename, filepath, decoded content
    │   └── review.py               # Review model — type, summary, issues (JSON), recommendations (JSON)
    └── routers/
        ├── auth.py                 # POST /register, POST /login, GET /me, PUT /settings
        ├── projects.py             # POST, GET, DELETE /projects
        ├── files.py                # POST /upload, POST /upload-multiple, GET, DELETE /files
        ├── reviews.py              # POST /reviews, GET /reviews/{project_id}, GET /reviews/detail/{id}
        └── chat.py                 # POST /chat — codebase Q&A
```

### Request Lifecycle

```
Incoming Request
      │
      ▼
CORS Middleware  (allows http://localhost:3000)
      │
      ▼
FastAPI Router   (prefix matching: /api/auth, /api/projects, etc.)
      │
      ▼
HTTPBearer       (extracts JWT from Authorization header)
      │
      ▼
get_current_user()  (decodes JWT → queries User from DB)
      │
      ▼
Route Handler    (business logic + SQLAlchemy ORM)
      │
      ├──► PostgreSQL via SQLAlchemy (all routes)
      │
      └──► OpenAI-compatible client (reviews and chat routes only)
```

### Startup Hook

On application startup, `ensure_user_settings_columns()` in `main.py` inspects the `users` table and adds any missing AI provider columns (`ai_provider`, `ai_base_url`, `ai_model`, `ai_api_key`) via `ALTER TABLE`. This allows iterative schema changes without a full migration cycle during development. In a production codebase, this would be replaced with Alembic versioned migrations.

### File Processing

Uploaded files are saved to disk under `/uploads` and their decoded text content is stored in the `files.content` column at upload time. This eliminates repeated disk reads during reviews and simplifies multi-file aggregation queries. Both UTF-8 and Latin-1 encodings are handled with a fallback decode strategy.

---

## Database Design

**Database:** PostgreSQL, hosted on Supabase

### Entity Relationship

```
users ──< projects ──< files
                  └──< reviews >── files (optional)
```

### Schema

```
TABLE users
─────────────────────────────────────────────────────
  id                INTEGER        PRIMARY KEY
  email             VARCHAR        UNIQUE  NOT NULL
  username          VARCHAR        UNIQUE  NOT NULL
  hashed_password   VARCHAR        NOT NULL
  role              VARCHAR        (member | admin | founder)
  ai_provider       VARCHAR        DEFAULT 'ollama'
  ai_base_url       VARCHAR        DEFAULT 'http://localhost:11434'
  ai_model          VARCHAR        DEFAULT 'llama3'
  ai_api_key        VARCHAR        DEFAULT ''
  created_at        TIMESTAMP      DEFAULT now()

TABLE projects
─────────────────────────────────────────────────────
  id                INTEGER        PRIMARY KEY
  name              VARCHAR        NOT NULL
  description       VARCHAR
  owner_id          INTEGER        FK → users.id
  created_at        TIMESTAMP      DEFAULT now()

TABLE files
─────────────────────────────────────────────────────
  id                INTEGER        PRIMARY KEY
  filename          VARCHAR        NOT NULL
  filepath          VARCHAR        NOT NULL
  content           TEXT
  project_id        INTEGER        FK → projects.id
  uploaded_at       TIMESTAMP      DEFAULT now()

TABLE reviews
─────────────────────────────────────────────────────
  id                INTEGER        PRIMARY KEY
  project_id        INTEGER        FK → projects.id
  file_id           INTEGER        FK → files.id   (nullable)
  review_type       VARCHAR        (general | security | performance | quality)
  summary           TEXT
  issues            JSON           [{severity, description}, ...]
  recommendations   JSON           [string, ...]
  created_at        TIMESTAMP      DEFAULT now()
```

### Design Notes

- `file_id` on the `reviews` table is nullable. A null value indicates a whole-project review; a populated value indicates a single-file review.
- AI provider settings are stored on the `users` table rather than a separate `ai_providers` table. This reflects the current single-user-per-account model and keeps the query path simple. A normalised `ai_providers` table would be appropriate if provider configurations were shared across team members.
- `issues` and `recommendations` are stored as JSON columns rather than separate tables. This avoids schema complexity for data that is always read and written as a complete set and never queried at the field level.

---

## AI Integration Flow

### Provider Abstraction

All AI calls are made through the **OpenAI Python SDK** with a runtime-configurable `base_url`. No provider-specific SDK is used. This satisfies the requirement for a configurable AI provider without hardcoded logic.

| Provider | Base URL |
|---|---|
| OpenAI | `https://api.openai.com/v1` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/` |
| Ollama (local) | `http://localhost:11434/v1` |
| LM Studio | `http://localhost:1234/v1` |
| Custom endpoint | User-defined |

Provider base URL, API key, and model name are stored per user in the database and transmitted by the frontend on each request, keeping the backend fully stateless with respect to AI configuration.

### Code Review Flow

```
POST /api/reviews/

  1.  Authenticate request → resolve project ownership
  2.  Load target files from DB (single file or all project files)
  3.  Concatenate file contents into a single code_content block
  4.  Select system prompt from REVIEW_PROMPTS based on review_type:

        "security"     → credentials, auth, input validation, injection risks
        "performance"  → slow operations, N+1 queries, inefficient rendering
        "quality"      → naming, structure, readability, maintainability
        "general"      → comprehensive review across all dimensions

  5.  Call OpenAI-compatible chat completions endpoint
  6.  Strip any markdown code fences from response (regex cleanup)
  7.  Parse JSON response → extract summary, issues[], recommendations[]
  8.  Persist Review record to PostgreSQL
  9.  Return structured result to client
```

### Codebase Chat Flow

```
POST /api/chat/

  1.  Authenticate request → resolve project ownership
  2.  Load all files for the project from DB
  3.  Build system prompt embedding full codebase as context
  4.  Append user's natural-language question
  5.  Call OpenAI-compatible chat completions endpoint
  6.  Return answer text to client
```

### Structured Review Response Format

The review system prompt instructs the model to return raw JSON exclusively. A regex step removes any markdown fences before parsing, ensuring compatibility across models that do not reliably honour format instructions.

```json
{
  "summary": "High-level overview of findings.",
  "issues": [
    {
      "severity": "critical | high | medium | low",
      "description": "Description of the detected issue."
    }
  ],
  "recommendations": [
    "Actionable improvement suggestion."
  ]
}
```

---

## Authentication & Security

- Passwords are hashed using **bcrypt** via `passlib`.
- JWT tokens are signed with **HS256** using a secret key loaded from environment variables.
- All protected routes use FastAPI's `HTTPBearer` dependency. The `get_current_user()` function decodes the token and validates the user exists in the database on every request.
- CORS is restricted to `http://localhost:3000` in development.
- AI API keys are stored in the database per user and never logged or exposed in API responses.
- Environment variables (database URL, secret key, API keys) are managed via `.env` and excluded from version control.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| GET | `/api/auth/me` | Get current user profile and AI settings |
| PUT | `/api/auth/settings` | Update AI provider configuration |
| POST | `/api/projects/` | Create a new project |
| GET | `/api/projects/` | List all projects for authenticated user |
| DELETE | `/api/projects/{id}` | Delete a project |
| POST | `/api/files/{project_id}/upload` | Upload a single file |
| POST | `/api/files/{project_id}/upload-multiple` | Upload multiple files |
| GET | `/api/files/{project_id}` | List files in a project |
| GET | `/api/files/content/{file_id}` | Get file content |
| DELETE | `/api/files/{file_id}` | Delete a file |
| POST | `/api/reviews/` | Run an AI review |
| GET | `/api/reviews/{project_id}` | List reviews for a project |
| GET | `/api/reviews/detail/{review_id}` | Get full review details |
| POST | `/api/chat/` | Ask a question about the codebase |