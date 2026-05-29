# JEE Tracker Application Workflow & System Architecture

This document provides a comprehensive overview of the JEE Tracker application's architecture, data schema, user workflows, and structural relationships. It is designed to help developers, teachers, and administrators understand how various parts of the platform are connected and how data flows through the system.

---

## 1. High-Level System Architecture

The JEE Tracker is built on a modern full-stack web architecture utilizing **Next.js (App Router)** as both the frontend UI and the backend API server, powered by a **Supabase PostgreSQL** database.

```mermaid
graph TD
    %% Portals & Users
    Admin["Platform Administrator"] -->|Accesses| AdminPortal["Admin Portal (/admin/*)"]
    Teacher["Subject Teacher"] -->|Accesses| TeacherPortal["Teacher Portal (/teacher/*)"]
    Student["JEE Aspirant (Student)"] -->|Accesses| StudentPortal["Student Portal (/student/*)"]

    %% Next.js Layer
    AdminPortal --> NextJS["Next.js Server (App Router & API Routes)"]
    TeacherPortal --> NextJS
    StudentPortal --> NextJS
    
    %% Middleware & Auth
    NextJS -->|Uses| Middleware["Route Protection Middleware (middleware.ts)"]
    Middleware -->|Verifies JWT| Cookies["httpOnly JWT Cookie (HS256 Session)"]
    
    %% Database Layer
    NextJS -->|PostgreSQL Queries via pg.Pool| DB[("Supabase PostgreSQL Database")]
    
    classDef portal fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef server fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;
    classDef database fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    class Admin,Teacher,Student portal;
    class NextJS,Middleware,Cookies server;
    class DB database;
```

### Key Architectural Pillars:
* **Custom JWT-based Authentication**: Instead of Supabase Auth, the system uses custom authentication. Passwords are encrypted with `bcrypt` (12 rounds), and sessions are managed using encrypted `HS256 JWT` payloads stored in secure `httpOnly` client cookies.
* **Role-Based Routing (Middleware)**: Intercepts all requests under `/admin`, `/teacher`, and `/student` to ensure the session contains the valid role.
* **Consolidated Academic Model**: A strictly relational structure in PostgreSQL that scales dynamically with index-backed optimizations.

---

## 2. Database Schema & Entity Relationships

The core database consists of three functional groups: **Users & Batches**, **Academic Taxonomy**, and **Logging & Practice Engines**.

```mermaid
erDiagram
    %% Core Users & Batches
    USERS ||--o| BATCH-STUDENTS : "belongs to (1-to-1)"
    BATCHES ||--o{ BATCH-STUDENTS : "contains"
    BATCHES ||--o{ BATCH-TEACHERS : "maps"
    USERS ||--o{ BATCH-TEACHERS : "teaches"
    SUBJECTS ||--o{ BATCH-TEACHERS : "mapped under"
    
    %% Academic Taxonomy
    SUBJECTS ||--o{ CHAPTERS : "contains"
    CHAPTERS ||--o{ MODULE-SETS : "associated with"
    
    %% Online Practice Engine
    USERS ||--o{ QUESTIONS : "creates (Teachers)"
    SUBJECTS ||--o{ QUESTIONS : "under"
    CHAPTERS ||--o{ QUESTIONS : "under"
    USERS ||--o{ QUESTION-ATTEMPTS : "attempts (Students)"
    QUESTIONS ||--o{ QUESTION-ATTEMPTS : "targeted by"
    
    %% Offline Logging System
    USERS ||--o{ MODULE-QUESTION-LOGS : "logs progress (Students)"
    MODULE-SETS ||--o{ MODULE-QUESTION-LOGS : "tracked under"
    USERS ||--o{ MODULE-DOUBT-NOTIFICATIONS : "raises (Students)"
    USERS ||--o{ MODULE-DOUBT-NOTIFICATIONS : "receives/resolves (Teachers)"
    MODULE-SETS ||--o{ MODULE-DOUBT-NOTIFICATIONS : "references"
    
    %% Communication & Analytics
    BATCHES ||--o{ ANNOUNCEMENTS : "targets"
    USERS ||--o{ ANNOUNCEMENTS : "posts (Teachers)"

    USERS {
        UUID id PK
        TEXT full_name
        TEXT username UK
        TEXT roll_number UK
        TEXT password_hash
        user_role role "('student', 'teacher', 'admin')"
        TEXT subject "Teacher's main subject (Physics, etc.)"
        TEXT teacher_code
        TEXT experience
    }
    
    BATCHES {
        UUID id PK
        TEXT name
        TEXT code UK "Unique shortcode (e.g. ALPHA2026)"
        TEXT description
        BOOLEAN is_active
    }
    
    BATCH-STUDENTS {
        UUID batch_id FK
        UUID student_id FK "PK, UNIQUE (Strictly 1 batch per student)"
        TIMESTAMPTZ enrolled_at
    }

    BATCH-TEACHERS {
        UUID batch_id FK "Composite PK"
        UUID teacher_id FK "Composite PK"
        UUID subject_id FK "Composite PK"
        TIMESTAMPTZ assigned_at
        %% UNIQUE (batch_id, subject_id) enforces one teacher per subject per batch
    }
    
    SUBJECTS {
        UUID id PK
        TEXT name UK "e.g. Physics"
        TEXT slug UK "e.g. physics"
    }

    CHAPTERS {
        UUID id PK
        UUID subject_id FK
        TEXT name
        TEXT slug
        INT sort_order
        %% UNIQUE (subject_id, slug)
    }

    MODULE-SETS {
        UUID id PK
        UUID chapter_id FK "Connects to Academic Taxonomy"
        TEXT subject "Redundant cached subject name"
        TEXT chapter "Redundant cached chapter name"
        TEXT module_name "e.g. Electromagnetism Vol 1"
        INTEGER question_count "Total offline questions"
        UUID created_by FK
    }

    MODULE-QUESTION-LOGS {
        UUID id PK
        UUID student_id FK
        UUID module_set_id FK
        INTEGER question_number
        TEXT status "('done', 'doubt', 'revision', 'not_done')"
        %% UNIQUE (student_id, module_set_id, question_number)
    }

    MODULE-DOUBT-NOTIFICATIONS {
        UUID id PK
        UUID student_id FK
        UUID module_set_id FK
        UUID teacher_id FK "Strictly routed assigned teacher"
        INTEGER question_number
        TEXT status "('doubt', 'revision')"
        BOOLEAN resolved
        UUID resolved_by FK
        TIMESTAMPTZ resolved_at
    }
```

### Relational Constraints Enforced:
1. **One-Student-One-Batch**: Enforced by a `UNIQUE (student_id)` constraint on `batch_students`.
2. **Dedicated Batch Teachers**: The `batch_teachers` table has a `UNIQUE (batch_id, subject_id)` constraint. This ensures a batch has exactly one teacher assigned for Physics, one for Chemistry, and one for Mathematics.
3. **No Duplicate Question Logs**: Enforced by `UNIQUE (student_id, module_set_id, question_number)` on `module_question_logs` to enable clean atomic upserts.

---

## 3. Core Workflows

### A. Academic Setup Workflow (Admin)
Administrators define the structure of the JEE curriculum. This structure is consumed by teachers (to create questions) and students (to explorer and log progress).

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant API as Admin Structure API
    participant DB as Supabase DB

    Admin->>API: Create Subject (e.g. Physics)
    API->>DB: INSERT INTO subjects
    DB-->>API: Subject Created
    
    Admin->>API: Create Chapter (e.g. Mechanics, linked to Physics)
    API->>DB: INSERT INTO chapters (subject_id, name, slug)
    DB-->>API: Chapter Created
    
    Admin->>API: Create Module Set (e.g. "Kinematics DPP 1", linked to Chapter "Mechanics")
    API->>DB: INSERT INTO module_sets (chapter_id, subject, chapter, module_name, question_count)
    DB-->>API: Module Set Created & Indexed
```

---

### B. Batch Enrolment & Teacher Mapping (Admin)
Admins configure coaching classrooms by enrolling students in batches and mapping dedicated teachers to specific subjects in those batches.

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant B_API as Batches API
    participant DB as Supabase DB

    Admin->>B_API: Create Batch (e.g. "Alpha 2026", code "ALPHA")
    B_API->>DB: INSERT INTO batches (name, code)
    DB-->>B_API: Batch Created
    
    Admin->>B_API: Enroll Student in Batch ALPHA
    B_API->>DB: INSERT INTO batch_students (batch_id, student_id) ON CONFLICT(student_id) DO UPDATE...
    DB-->>B_API: Enrolled Successfully (Syncs users.batch_code)
    
    Admin->>B_API: Assign Teacher to Batch ALPHA for Physics
    Note over B_API,DB: Enforces ONE Physics teacher per batch
    B_API->>DB: INSERT INTO batch_teachers (batch_id, teacher_id, subject_id)
    DB-->>B_API: Mapping Saved
```

---

### C. Offline Module Logging & Doubt Routing Workflow
This is the core learning loop of the application. Students solve physical textbook coaching modules offline, log their progress, and raise doubts that route directly to their assigned teacher.

```mermaid
graph TD
    %% Workflow Steps
    Step1["1. Student marks Question #12 as 'doubt' in offline log UI"] --> Step2["2. Student clicks 'Raise Doubt to Teacher' button"]
    Step2 --> Step3["3. Next.js API resolves the doubt's path upward:"]
    
    %% API Resolution Detail
    subgraph Path Resolution
        Step3 --> Step3A["Module Set M → Chapter C → Subject S"]
        Step3 --> Step3B["Student ID → batch_students → Batch B"]
    end
    
    Step3A & Step3B --> Step4["4. Query batch_teachers for Batch B & Subject S"]
    Step4 -->|Found Teacher X| Step5["5. Insert notification with teacher_id = X"]
    Step4 -->|No Teacher Assigned| StepFallback["5b. Return structured 400 Bad Request error to UI"]
    
    Step5 --> Step6["6. Teacher X logs in, dashboard fetches where teacher_id = X"]
    Step6 --> Step7["7. Teacher X sees & resolves the doubt on dashboard"]
    Step7 --> Step8["8. Doubt status updates to Resolved; student dashboard shows resolution"]
    
    classDef resolve fill:#0284c7,stroke:#38bdf8,stroke-width:1px,color:#f8fafc;
    classDef endPoint fill:#15803d,stroke:#4ade80,stroke-width:1px,color:#f8fafc;
    classDef fail fill:#b91c1c,stroke:#f87171,stroke-width:1px,color:#f8fafc;
    class Step3A,Step3B resolve;
    class Step8 endPoint;
    class StepFallback fail;
```

#### Detailed Doubt Routing Query Logic:
When a doubt is raised, the system executes this precise routing logic:
```sql
SELECT bt.teacher_id, u.role
FROM module_sets ms
JOIN chapters c ON c.id = ms.chapter_id
JOIN batch_students bs ON bs.student_id = $1 -- Student ID
JOIN batch_teachers bt ON bt.batch_id = bs.batch_id AND bt.subject_id = c.subject_id
JOIN users u ON u.id = bt.teacher_id
WHERE ms.id = $2 -- Module Set ID
LIMIT 1;
```
1. This query ensures that a notification is **never** globally broadcasted to all teachers.
2. It guarantees the doubt goes to the teacher responsible for that subject *in that student's specific batch*.
3. If no teacher is assigned for that subject in the student's batch, the API throws a graceful user-facing `400` error asking the Admin to verify batch teacher assignments, preventing silent database exceptions.

---

### D. Interactive Student Progress Insights Workflow
Admin and Teacher portals feature full visibility into student progress. Clicking a student's name anywhere immediately launches their interactive academic profile.

```mermaid
sequenceDiagram
    autonumber
    actor User as Admin / Teacher
    participant UI as Dashboard / Doubts Panel
    participant Router as NextJS Router
    participant Analytics as Insights Engine (Analytics)
    
    User->>UI: Clicks Student Name (e.g. "Aarav Sharma")
    UI->>Router: Navigate to `/admin/users/[id]` OR `/teacher/students/[id]`
    Router->>Analytics: Load Student Profile Page
    
    Note over Analytics,Router: Queries batches, offline module completion rate, & online accuracy stats
    Analytics->>Analytics: Aggregates metrics (done vs revision, velocity, etc.)
    Analytics-->>User: Renders premium data-rich visualization dashboards
```

---

### E. Teacher Announcements & Student Feeds
Teachers can broadcast notifications, updates, or assignments directly to their batches.

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant API as Announcement API
    participant DB as Supabase DB
    actor Student

    Teacher->>API: Publish Announcement for Batch ALPHA
    Note over API: Validates Teacher belongs to Batch ALPHA
    API->>DB: INSERT INTO announcements (teacher_id, batch_id, title, body)
    DB-->>API: Published Successfully
    
    Student->>DB: Accesses `/student/dashboard`
    Note over DB,Student: Queries announcements WHERE batch_id = Student's Batch
    DB-->>Student: Renders announcements chronological feed
```

---

## 4. Summary of System Portals & Navigation Routes

Here is a quick reference table of routes within the application:

| User Role | Page / Endpoint | Purpose |
| :--- | :--- | :--- |
| **Common** | `/signup` | Student-only registration page (Admin registers teachers/admins). |
| **Common** | `/login/student`, `/login/teacher`, `/login/admin` | Custom secure login gateways. |
| **Admin** | `/admin/dashboard` | Main admin overview (Total batches, system activity stats). |
| **Admin** | `/admin/batches` | Create batches, enroll students, and assign subject teachers. |
| **Admin** | `/admin/structure` | Manage the primary subject taxonomy and chapter ordering. |
| **Admin** | `/admin/modules` | Set up offline modules and DPP question counts. |
| **Admin** | `/admin/users` | Lists all platform users with deep-dive insight profile links. |
| **Teacher** | `/teacher/dashboard` | Batch statistics overview and pending doubts feed. |
| **Teacher** | `/teacher/module-doubts` | Doubt notification center strictly showing routed questions. |
| **Teacher** | `/teacher/students` | Detailed progress insight rosters for assigned batch students. |
| **Teacher** | `/teacher/questions` | Online practice engine question bank and editor. |
| **Student** | `/student/dashboard` | Announcement feed, subject shortcuts, and overall logging progress. |
| **Student** | `/student/module-log` | Log offline coaching module question status and raise teacher doubts. |
| **Student** | `/student/explorer` | Track and initiate practice sessions for online questions by category. |
| **Student** | `/student/practice` | Question practice screen featuring immediate correct/wrong validation. |
| **Student** | `/student/mistakes` | Targeted practice engine filter for question attempts marked as mistakes. |
