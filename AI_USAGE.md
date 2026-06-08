# AI Usage — Code Review Assistant

## AI Tools Used

| Tool | Purpose |
|---|---|
| **Claude (Anthropic)** | Architecture planning, code scaffolding, debugging assistance |
| **Google Gemini 2.5 Flash** | Runtime AI provider within the application for code reviews and chat |
| **Ollama (llama3, local)** | Default offline AI provider; no API key required |

---

## Development Approach

AI tools were used selectively as productivity aids — primarily for scaffolding boilerplate, exploring API patterns, and accelerating repetitive implementations. All generated code was reviewed, understood, and in most cases significantly modified before being integrated. The core architecture, data flow design, and engineering decisions were made independently.

---

## Code Origin

### Backend — FastAPI

**AI-assisted (scaffolded then modified):**
- `routers/reviews.py` — initial structure of the review endpoint; `REVIEW_PROMPTS` dict, JSON parsing, and DB persistence logic were reviewed and edited
- `routers/chat.py` — base scaffold of the codebase Q&A endpoint
- `routers/files.py` — multi-file upload endpoint and encoding fallback pattern (UTF-8 → Latin-1)
- `main.py` — `ensure_user_settings_columns()` startup migration guard
- SQLAlchemy models (`user.py`, `project.py`, `file.py`, `review.py`)

**Written independently:**
- `routers/auth.py` — login, registration, JWT encoding, and AI settings update endpoints
- `database.py` — engine, session factory, and `get_db` dependency
- All error handling, HTTP status codes, and validation logic
- `.env` configuration and environment setup

### Frontend — Next.js / React

**AI-assisted (scaffolded then modified):**
- `app/page.tsx` — landing page layout; hero, features grid, how-it-works section, footer
- `components/AppShell.tsx` — collapsible sidebar shell
- `components/ToastProvider.tsx` — toast notification context
- `components/AnimatedCounter.tsx` — `requestAnimationFrame`-based counter

**Written independently:**
- All Axios API calls, auth token management, and protected routing
- Dashboard data-fetching logic including `Promise.allSettled` fan-out for project enrichment
- `recentActivity` derived state, `healthFor()` project status logic
- Onboarding widget state machine and `localStorage` persistence
- All form handling and user interaction logic

---

## Prompts Used (Representative)

**Backend:**
- *"Create a FastAPI POST endpoint that accepts project_id, review_type, and AI provider settings, concatenates file contents from the DB, calls an OpenAI-compatible endpoint, parses the JSON response, and saves the result using SQLAlchemy."*
- *"Write a startup function that inspects a PostgreSQL table and adds missing columns using ALTER TABLE without requiring Alembic."*

**Frontend:**
- *"Build a Next.js dashboard with a dark glassmorphism theme using Tailwind. Show project cards with file count, review count, and a status badge."*
- *"Create a collapsible sidebar component with active route highlighting using Next.js usePathname."*

---

## Engineering Decisions

The following decisions were made independently and are not a product of AI suggestions:

**1. OpenAI SDK as universal provider abstraction**
Rather than using provider-specific SDKs, the OpenAI Python client is pointed at a configurable `base_url`. This supports Ollama, Gemini, OpenAI, and any custom endpoint through a single code path — directly satisfying the assessment requirement for configurable AI providers.

**2. AI settings passed per-request from the frontend**
Provider URL, API key, and model name are stored in the user profile and sent with each review or chat request. This makes provider switching instant and requires no server-side session state.

**3. `Promise.allSettled` for dashboard enrichment**
Used instead of `Promise.all` so a failed file-count or review-count fetch for one project does not abort the entire dashboard load.

**4. File content stored as TEXT at upload time**
Storing decoded file content in the database at upload eliminates repeated disk reads during reviews and simplifies the query path for multi-file review aggregation.

**5. Startup column guard instead of Alembic**
An idempotent `ALTER TABLE` check on startup was chosen over full migration tooling for pragmatic reasons during a time-constrained build. This is acknowledged as a trade-off and would be replaced with Alembic in a production codebase.

**6. `ensure_user_settings_columns()` as schema evolution strategy**
New per-user AI provider fields were added via the startup guard rather than a migration, enabling zero-downtime column additions during iterative development.