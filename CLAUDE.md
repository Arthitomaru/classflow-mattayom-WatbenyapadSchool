# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Non-standard Next.js

This project uses **Next.js 16.2.6** with **React 19**, which has breaking changes from earlier versions. APIs, conventions, and file structure may differ from training data. Verify Next.js App Router APIs against the official docs rather than assuming behavior from prior versions.

## Commands

```bash
npm run dev       # Start dev server on http://localhost:3000
npm run build
npm start
npm run lint
```

No test suite is configured.

## Architecture

**Assignment Hub** is a Thai middle-school academic platform: assignment submission, AI-assisted grading, course management, and quizzes. Three roles: `teacher`, `student`, `admin`.

### Route structure (App Router)

- `app/(auth)/` — unauthenticated: `login`, `signup`, `forgot-password`, `update-password`
- `app/(dashboard)/` — protected; layout enforces auth via Supabase server client; renders `Sidebar` (role-based nav)
  - `teacher/` — dashboard, course list
  - `teacher/courses/[id]/` — course detail, assignments, submissions grading
  - `teacher/courses/[id]/assignments/new` — create assignment
  - `teacher/courses/[id]/assignments/[aid]/` — view submissions, AI grade panel
  - `teacher/courses/[id]/content/` — manage topics & content items
  - `teacher/courses/[id]/quizzes/` — quiz management
  - `student/` — dashboard, enrolled courses
  - `student/courses/[id]/` — course content & assignments
  - `student/courses/[id]/quizzes/[qid]/take/` — take quiz
  - `student/courses/[id]/quizzes/[qid]/result/` — quiz results
  - `student/assignments/` — all assignments
  - `student/submit/[id]/` — submit assignment (text + file upload)
  - `admin/` — dashboard, user management (`/users`, `/users/new`, `/users/[id]/edit`)
  - `change-password/` — all authenticated users
- `app/api/ai-grade/route.ts` — POST; calls Claude to grade a submission; teacher-only
- `app/auth/callback/route.ts` — Supabase OAuth code exchange handler
- `proxy.ts` — **not wired up**: exports `proxy` + `config` for auth middleware but no `middleware.ts` imports it. To activate, create `middleware.ts` re-exporting `proxy` as `middleware` and `config`.

### Auth & data layer

- **Supabase** handles auth, database, and file storage. Use `lib/supabase/server.ts` in Server Components and Route Handlers; `lib/supabase/client.ts` for Client Components.
- Database types are hand-maintained in `types/database.ts` (not generated from Supabase).

**Full database schema:**

| Table | Key columns |
|---|---|
| `profiles` | `id`, `role` (teacher\|student\|admin), `full_name`, `grade` (ม.1\|ม.2\|ม.3\|null), `classroom`, `phone`, `avatar_url` |
| `courses` | `id`, `code`, `name`, `description`, `teacher_id` → profiles |
| `enrollments` | `id`, `course_id`, `student_id` → profiles |
| `assignments` | `id`, `title`, `description`, `due_date`, `grade` (class target), `subject`, `teacher_id`, `course_id` |
| `submissions` | `id`, `assignment_id`, `student_id`, `text_content`, `file_url`, `file_name`, `status` (submitted\|graded), `grade` (0–100), `feedback`, `ai_feedback` (JSON string) |
| `topics` | `id`, `course_id`, `title`, `topic_order` |
| `content_items` | `id`, `topic_id`, `title`, `description`, `type` (file\|youtube\|link), `url`, `file_path`, `item_order` |
| `quizzes` | `id`, `course_id`, `topic_id`, `title`, `description`, `status` (draft\|open\|closed) |
| `quiz_questions` | `id`, `quiz_id`, `question_text`, `points`, `question_order` |
| `quiz_choices` | `id`, `question_id`, `choice_text`, `is_correct`, `choice_order` |
| `quiz_attempts` | `id`, `quiz_id`, `student_id`, `score`, `total_possible`, `submitted_at` |
| `quiz_answers` | `id`, `attempt_id`, `question_id`, `chosen_choice_id` |

**`grade` field collision** — three meanings across tables:
- `profiles.grade` — student's class level: `'ม.1' | 'ม.2' | 'ม.3'`
- `assignments.grade` — which class level the assignment targets (same enum)
- `submissions.grade` — numeric score 0–100

File uploads → Supabase Storage bucket `submissions`, path `{student_id}/{assignment_id}/{timestamp}.{ext}`.

### AI grading

`lib/claude.ts` exports `gradeSubmission()` → calls `claude-sonnet-4-6`, returns `GradeResult` (`feedback`, `suggestedGrade` 0–100, `strengths[]`, `improvements[]`). API route saves result as JSON string in `submissions.ai_feedback`. Teacher applies or adjusts via `GradePanel.tsx`. Disabled for file-only submissions (`text_content` null).

### Utilities

`lib/utils.ts`: `cn()` (clsx + tailwind-merge), `formatDate()` / `formatDateTime()` (Thai locale `th-TH`), `daysRemaining()` (returns Thai strings like `"เลยกำหนดแล้ว"`), `gradeToLetter()` (A–F scale).

### Styling

Tailwind CSS v4 with "parchment manuscript" design tokens in `app/globals.css`:

| Token | Hex | Usage |
|---|---|---|
| `parchment` | `#F5F0E8` | page/shell background |
| `parchment-dark` | `#EDE8DF` | card/input background |
| `ink` | `#1C1917` | primary text |
| `ink-muted` | `#78716C` | secondary text, labels |
| `rust` | `#B45309` | accent, CTA, links |
| `rust-dark` | `#92400E` | rust hover state |
| `rust-subtle` | `#FEF3C7` | soft rust tint |
| `seam` | `#C9BFB0` | borders |
| `seam-light` | `#E7E0D6` | lighter borders |
| `verdant` | `#15803D` | success/graded state |
| `crimson` | `#DC2626` | error state |

Fonts: `font-display` = Playfair Display (headings), `font-sans`/`font-mono` = JetBrains Mono (body/code). Loaded via `next/font/google`.

## Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
```
