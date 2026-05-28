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
  - `teacher/` — dashboard, course list, assignment overview
  - `teacher/courses/[id]/` — course detail (assignments, enrollments, topics, quizzes)
  - `teacher/courses/[id]/assignments/[aid]/` — view submissions, AI grade panel, inline edit
  - `teacher/courses/[id]/content/new` — add content items (YouTube/file/link)
  - `teacher/courses/[id]/quizzes/[qid]/` — quiz editor; `/results` — student attempt breakdown
  - `student/` — dashboard, enrolled courses
  - `student/courses/[id]/` — course content & assignments
  - `student/submit/[id]/` — submit assignment (text + multi-file upload)
  - `admin/` — dashboard, user management (`/users`, `/users/new`, `/users/[id]/edit`)
  - `admin/submissions/` — global submission overview across all courses
- `app/api/ai-grade/route.ts` — POST; calls Claude to grade a submission; teacher-only
- `app/auth/callback/route.ts` — Supabase OAuth code exchange handler

### Auth & data layer

- **Supabase** handles auth, database, and file storage.
  - `lib/supabase/server.ts` — use in Server Components and Route Handlers (user-scoped JWT, subject to RLS)
  - `lib/supabase/client.ts` — use in Client Components
  - `lib/supabase/admin.ts` — `createAdminClient()` uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses all RLS
- Database types are hand-maintained in `types/database.ts` (not generated from Supabase).

### RLS bypass pattern — critical

Supabase RLS restricts rows by the logged-in user's JWT role. **Admin users are blocked by RLS the same as any other user** unless you explicitly use `createAdminClient()`.

Rules:
- **All server actions that write data** (`addContentItem`, `createAssignment`, `addTopic`, `addEnrollment`, `createCourse`, quiz actions, etc.) use `createAdminClient()` after an auth/role check.
- **All Server Component data fetches on pages that admin can visit** must switch to `createAdminClient()` when `isAdmin`. Pattern used throughout:
  ```ts
  const isAdmin = profile?.role === 'admin'
  const db = isAdmin ? createAdminClient() : supabase
  ```
- `lib/supabase/server.ts` (regular client) is still used for auth checks (`getUser()`, reading `profiles` for the current user only).

### Server actions location

Each feature area has its own `actions.ts` (all `'use server'`):

| File | Exports |
|---|---|
| `teacher/courses/actions.ts` | `createCourse`, `addTopic`, `addEnrollment` |
| `teacher/courses/[id]/content/actions.ts` | `addContentItem`, `deleteContentItem`, `updateContentItem` |
| `teacher/courses/[id]/assignments/actions.ts` | `createAssignment`, `updateAssignment`, `deleteAssignment` |
| `teacher/courses/[id]/quizzes/actions.ts` | `createQuiz`, `updateQuizStatus`, `deleteQuiz`, `addQuestion`, `updateQuestion`, `deleteQuestion`, `addChoice`, `setCorrectChoice`, `deleteChoice`, `importFromGoogleForms` |
| `admin/actions.ts` | `createUser`, `updateUser`, `deleteUser` |
| `notifications/actions.ts` | `notifyAssignmentCreated`, `notifyContentAdded` |

All write actions use `createAdminClient()` internally. Auth guard pattern:
```ts
async function assertTeacherOrAdmin(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') redirect('/')
  return user.id
}
```

### Admin capabilities

Admin has full teacher-equivalent access to all course management pages under `/teacher/courses/`. The admin sidebar "จัดการวิชา" links to `/teacher/courses` (not `/admin/courses`). The `/admin/courses` route still exists for search/delete. Pages that admin visits must use `createAdminClient()` for data fetches — this is already done for all current pages.

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
| `notifications` | `id`, `user_id`, `type` (assignment_created\|content_added\|quiz_open), `title`, `body`, `link`, `is_read` |

**`grade` field collision** — three meanings across tables:
- `profiles.grade` — student's class level: `'ม.1' | 'ม.2' | 'ม.3'`
- `assignments.grade` — which class level the assignment targets (same enum)
- `submissions.grade` — numeric score 0–100

### Multi-file submissions

`submissions.file_url` and `submissions.file_name` store either:
- A plain URL string (old single-file format, still valid)
- A JSON array string: `'["url1","url2"]'` / `'["name1","name2"]'`

Parse helper used in both `student/submit/[id]/page.tsx` and `GradePanel.tsx`:
```ts
function parseFiles(file_url, file_name): { url: string; name: string }[] {
  try {
    const urls = JSON.parse(file_url); const names = JSON.parse(file_name)
    if (Array.isArray(urls)) return urls.map((url, i) => ({ url, name: names[i] }))
  } catch { return [{ url: file_url, name: file_name }] }
}
```

File uploads → Supabase Storage bucket `submissions`, path `{student_id}/{assignment_id}/{timestamp}_{random}.{ext}`.
Course content files → bucket `course-content`, path `{courseId}/{timestamp}.{ext}`.

### Notifications

`lib/notifications.ts` exports `notifyEnrolledStudents(courseId, type, title, body, link)` — fan-out insert to `notifications` table for all enrolled students. Always uses `createAdminClient()`. Called fire-and-forget from server actions; failures are swallowed so they never break the main operation.

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
| `seam` | `#C9BFB0` | borders |
| `verdant` | `#15803D` | success/graded state |
| `crimson` | `#DC2626` | error state |

Fonts: `font-display` = Playfair Display (headings), `font-mono` = JetBrains Mono (body/code). Loaded via `next/font/google`.

## Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # used by createAdminClient() — never exposed to browser
ANTHROPIC_API_KEY
```
