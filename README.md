<div align="center">

# 🧠 AI Code Review Assistant

**Enterprise-grade, AI-powered code review — automated, context-aware, and built for teams.**

[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📋 Overview

**AI Code Review Assistant** is a full-stack, intelligent platform that automates and supercharges software quality assurance. Upload your code, choose your AI provider, and receive deep, multi-dimensional reviews covering security vulnerabilities, performance bottlenecks, and code quality — all within a sleek, modern SaaS dashboard.

Built with a decoupled microservices architecture and support for both local and cloud-based LLMs (Ollama, Google Gemini, OpenAI-compatible), the platform is designed to slot into any engineering team's workflow with minimal friction.

---

## 📸 Screenshots

### 🔐 Login & Landing
> A polished, premium landing page with side-by-side auth — first impressions matter.

![Login Page](screenshots/ss_login.png)

---

### 🖥️ Dashboard
> Central command — create projects, track activity, and see your workspace health at a glance.

![Dashboard](screenshots/ss_dashboard.png)

---

### 📁 Project Workspace
> Upload files, select review type, and trigger analysis — all from one clean layout.

![Project Workspace](screenshots/ss_workspace.png)

---

### 🗂️ Project Management
> Each project card shows file count, review count, and last activity — organized and beautiful.

![Project Card](screenshots/ss_project_card.png)

---

### 📂 File Explorer
> Search and navigate uploaded files with a minimal, keyboard-friendly explorer panel.

![File Explorer](screenshots/ss_file_explorer.png)

---

### 🤖 AI Provider Settings
> Switch between Ollama, OpenAI-compatible, Gemini, or a custom endpoint — all synced to your account.

![AI Provider Settings](screenshots/ss_provider_settings.png)

---

### 📝 Review Details
> Structured output with a clear summary, severity-tagged issues, and actionable findings.

![Review Details](screenshots/ss_review_details.png)

---

### 💡 Recommendations
> Context-aware improvement suggestions written in plain language, not jargon.

![Recommendations](screenshots/ss_recommendations.png)

---

### 🕓 Review History
> A searchable timeline of every past analysis — track quality improvements over time.

![Review History](screenshots/ss_review_history.png)

---

### 💬 Chat with Codebase
> Ask anything about your uploaded code — architecture, bugs, walkthroughs — powered by RAG.

![AI Chat](screenshots/ss_ai_chat.png)

---

## ✨ Features

### 🔐 Secure by Design
JWT-based authentication with user registration, login, and session management — production-ready out of the box.

### 📁 Project Management
Organize all your reviews into logical workspaces. One project per repo, team, or sprint — your call.

### 🔍 Multi-Dimensional AI Reviews
Submit code and receive targeted analysis across three dimensions:

| Review Type | What It Catches |
|---|---|
| 🛡️ **Security** | Vulnerabilities, injection risks, insecure patterns |
| ⚡ **Performance** | Bottlenecks, Big-O inefficiencies, memory leaks |
| 🧹 **Code Quality** | Clean code principles, style, maintainability |

### 💬 Chat with Your Codebase
A RAG-inspired conversational interface that lets you ask context-aware questions directly against your uploaded files. Think of it as a senior developer who has read every line of your code.

### 🤖 Flexible AI Provider Support
Switch seamlessly between providers without changing your workflow:

- **Ollama** — Local LLM execution for maximum privacy
- **Google Gemini** — Cloud-based, state-of-the-art reasoning
- **OpenAI-compatible** — Works with any OpenAI-format API endpoint
- **Custom** — Bring your own hosted AI endpoint

### 📤 Export Reports
Download AI review reports instantly as **PDF** or **Markdown** for sharing, archiving, or integration into pull request workflows.

### 🕓 Review History
All past reviews are persisted in PostgreSQL so you can track code quality improvements over time.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                       │
│         Next.js (SSR + CSR) · React 18 · TypeScript     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                      API LAYER                          │
│            FastAPI · Async · JWT Auth · CORS            │
└─────────┬──────────────────────────┬────────────────────┘
          │                          │
┌─────────▼──────────┐   ┌───────────▼──────────────────┐
│     DATA LAYER     │   │       AI ORCHESTRATION        │
│  PostgreSQL (ORM)  │   │  Ollama · Gemini · OpenAI     │
│    SQLAlchemy      │   │   Dynamic prompt routing      │
└────────────────────┘   └──────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy ORM |
| **Database** | PostgreSQL |
| **Auth** | PyJWT, Passlib (bcrypt) |
| **AI Providers** | Ollama, Google Gemini API, OpenAI-compatible APIs |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- PostgreSQL (local or remote)
- [Ollama](https://ollama.com/) *(optional — for local LLM execution)*

---

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
```

```env
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/code_review_db
JWT_SECRET_KEY=your_super_secret_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

```bash
# 5. Start the API server
uvicorn main:app --reload --port 8000
```

API docs auto-generated at → **`http://localhost:8000/docs`**

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env.local file
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
# 4. Start the dev server
npm run dev
```

Frontend running at → **`http://localhost:3000`**

---

## 📖 Usage

1. **Choose your AI Provider** — Go to Settings and select Ollama (local), Gemini, or OpenAI.
2. **Create a Project** — Set up a workspace for your codebase or repository.
3. **Upload Code** — Single file or batch upload both supported.
4. **Run a Review** — Pick Security, Performance, or Code Quality analysis.
5. **Chat** — Use the "Chat with Codebase" tab to drill into specifics.
6. **Export** — Download the full report as PDF or Markdown.

---

## 📂 Project Structure

```
code-review-assistant/
├── backend/
│   ├── app/
│   │   ├── api/           # Route handlers / endpoints
│   │   ├── core/          # Config, security, auth
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   └── services/      # AI orchestration & business logic
│   ├── main.py            # FastAPI entry point
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── hooks/         # Custom React hooks
    │   ├── lib/           # API clients & utilities
    │   └── pages/         # Next.js routing
    ├── tailwind.config.js
    └── package.json
```

---

## 🔌 REST API Reference

Swagger UI: `http://localhost:8000/docs`

| Namespace | Description |
|---|---|
| `/auth` | JWT token generation, registration, validation |
| `/projects` | CRUD for project workspaces |
| `/files` | File upload, parsing, and storage |
| `/reviews` | Trigger and retrieve AI-generated reviews |
| `/chat` | Conversational RAG queries against codebase |
| `/settings` | AI provider configuration |

---

## 🚢 Deployment

| Component | Recommended Platform |
|---|---|
| **Frontend** | [Vercel](https://vercel.com/) |
| **Backend** | Docker → AWS ECS / Render / Google Cloud Run |
| **Database** | Supabase / AWS RDS / ElephantSQL |

---

## 🛣️ Roadmap

- [ ] **GitHub App Integration** — Automatic PR reviews on push
- [ ] **VS Code / Cursor Extension** — AI reviews directly inside the editor
- [ ] **Vector Search (RAG v2)** — pgvector / Pinecone for deep semantic codebase search
- [ ] **Team Collaboration** — Shared projects, comments, and role-based access
- [ ] **CI/CD Webhook Support** — Trigger reviews automatically from build pipelines

---

## 👨‍💻 Author

**Dhananjay Baral** — Software Developer & AI Enthusiast, focused on intelligent developer tools and modern full-stack systems.

[![GitHub](https://img.shields.io/badge/GitHub-india83win--creator-181717?logo=github)](https://github.com/india83win-creator)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Dhananjay%20Baral-0A66C2?logo=linkedin)](https://www.linkedin.com/in/dhananjay-baral-62150337a)

---

<div align="center">

If you find this project useful, consider giving it a ⭐ — it helps a lot!

</div>