# JEE Tracker — Custom Authentication

A JEE preparation platform with **custom authentication** (not Supabase Auth): bcrypt password hashing, JWT sessions in httpOnly cookies, and role-based route protection.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + shadcn-style UI components
- **Supabase PostgreSQL** (database only)
- **bcryptjs** + **jose** (JWT)

## Features

| Feature | Route |
|--------|--------|
| Student signup | `/signup` |
| Student login (username or roll number) | `/login/student` |
| Teacher login | `/login/teacher` |
| Admin login | `/login/admin` |
| Student portal | `/student/*` |
| Teacher portal | `/teacher/*` |
| Admin portal | `/admin/*` |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server only, never expose to client)
- `JWT_SECRET` — at least 32 random characters

### 3. Create database table

In the **Supabase SQL Editor**, run:

`supabase/migrations/001_users.sql`

### 4. Seed teacher / admin users

Students register via `/signup`. Teachers and admins are seeded:

```bash
node --env-file=.env.local scripts/seed-user.mjs teacher faculty01 YourPass1 "Faculty Name"
node --env-file=.env.local scripts/seed-user.mjs admin platform_admin YourPass1 "Platform Admin"
```

Password must meet signup rules when students register; seed script accepts any password you pass.

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Student Question Practice

| Page | URL |
|------|-----|
| Student dashboard | `/student/dashboard` |
| Question Explorer (progress by category) | `/student/explorer` |
| Practice session | `/student/practice?subjectId=&chapterId=&categoryId=&filter=&q=0` |

**Practice filters:** all, attempted, not attempted, doubts, revision, mastered.

**After wrong answer:** Reattempt and View solution only (solution hidden until chosen).

Run migration: `node --env-file=.env.local scripts/run-migration.mjs 003_student_attempts.sql`

## Teacher Question Management

| Page | URL |
|------|-----|
| Teacher dashboard | `/teacher/dashboard` |
| Question bank (filters + search) | `/teacher/questions` |
| Create question | `/teacher/questions/new` |
| View question | `/teacher/questions/[id]` |

**Categories:** Solved Examples, DPP, Prabal (JEE Main), Parikshit (JEE Advanced), Topic Wise, PW Challengers, Created by Teacher (Easy/Medium/Hard required).

**Question types:** MCQ (with options editor) or Integer.

Run migration: `node --env-file=.env.local scripts/run-migration.mjs 002_questions.sql`

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Student registration |
| POST | `/api/auth/login/student` | Student login |
| POST | `/api/auth/login/teacher` | Teacher login |
| POST | `/api/auth/login/admin` | Admin login |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Current user (requires session) |
| GET | `/api/teacher/metadata` | Subjects, chapters, categories |
| GET/POST | `/api/teacher/questions` | List / create questions |
| GET/DELETE | `/api/teacher/questions/[id]` | View / delete question |
| GET | `/api/teacher/stats` | Dashboard stats |

## Architecture

```
src/
├── app/                    # Pages & API routes
├── components/
│   ├── auth/               # Reusable auth UI
│   ├── dashboard/          # Dashboard shell
│   └── ui/                 # shadcn-style primitives
├── lib/
│   ├── auth/               # JWT, session, password, client
│   ├── db/                 # Supabase client & user repository
│   └── validations/        # Zod schemas
├── middleware.ts           # Role-based route protection
└── types/
```

### Application Workflows & Connections

For an in-depth breakdown of the system architecture, database entity relationships, and core workflows (such as Admin academic/batch setup, the offline module logging system, and strict student-to-teacher doubt routing), please check out the comprehensive [Workflow Documentation](file:///r:/JEE%20Tracking/docs/workflow.md).


## Security notes

- Passwords are hashed with **bcrypt** (12 rounds).
- Sessions use **httpOnly** cookies with **HS256 JWT** (7-day expiry).
- Use the **service role key** only on the server.
- Never commit `.env.local`.
