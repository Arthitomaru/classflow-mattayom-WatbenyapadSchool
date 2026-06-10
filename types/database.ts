export type Role = 'teacher' | 'student' | 'admin'
export type Grade = 'ม.1' | 'ม.2' | 'ม.3' | 'ป.4' | 'ป.5'
export type SubmissionStatus = 'submitted' | 'graded'

export interface Profile {
  id: string
  role: Role
  full_name: string
  grade: Grade | null
  avatar_url: string | null
  classroom: string | null
  phone: string | null
  created_at: string
}

export interface Course {
  id: string
  code: string
  name: string
  description: string | null
  teacher_id: string
  created_at: string
  profiles?: Profile
  enrollments?: { count: number }[]
}

export interface Enrollment {
  id: string
  course_id: string
  student_id: string
  created_at: string
  courses?: Course
  profiles?: Profile
}

export interface Assignment {
  id: string
  title: string
  description: string | null
  due_date: string | null
  grade: Grade | null
  subject: string | null
  teacher_id: string
  course_id: string | null
  created_at: string
  profiles?: Profile
  submissions?: { count: number }[]
}

export interface Topic {
  id: string
  course_id: string
  title: string
  topic_order: number
  created_at: string
  content_items?: ContentItem[]
}

export interface ContentItem {
  id: string
  topic_id: string
  title: string
  description: string | null
  type: 'file' | 'youtube' | 'link'
  url: string | null
  file_path: string | null
  item_order: number
  created_at: string
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  text_content: string | null
  file_url: string | null
  file_name: string | null
  status: SubmissionStatus
  grade: number | null
  feedback: string | null
  ai_feedback: string | null
  submitted_at: string
  graded_at: string | null
  profiles?: Profile | null
  assignments?: Assignment | null
}

export type QuizStatus = 'draft' | 'open' | 'closed'

export interface Quiz {
  id: string
  course_id: string
  topic_id: string | null
  title: string
  description: string | null
  status: QuizStatus
  created_at: string
  quiz_questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  points: number
  question_order: number
  quiz_choices?: QuizChoice[]
}

export interface QuizChoice {
  id: string
  question_id: string
  choice_text: string
  is_correct: boolean
  choice_order: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  student_id: string
  score: number
  total_possible: number
  submitted_at: string
  created_at: string
  profiles?: Profile
  quizzes?: Quiz
}

export interface QuizAnswer {
  id: string
  attempt_id: string
  question_id: string
  chosen_choice_id: string
  quiz_choices?: QuizChoice
  quiz_questions?: QuizQuestion
}

export type NotificationType = 'assignment_created' | 'content_added' | 'quiz_open'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          teacher_id: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          teacher_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          teacher_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      enrollments: {
        Row: {
          id: string
          course_id: string
          student_id: string
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          student_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          student_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          role: 'teacher' | 'student' | 'admin'
          full_name: string
          grade: 'ม.1' | 'ม.2' | 'ม.3' | 'ป.4' | 'ป.5' | null
          avatar_url: string | null
          classroom: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'teacher' | 'student' | 'admin'
          full_name: string
          grade?: 'ม.1' | 'ม.2' | 'ม.3' | 'ป.4' | 'ป.5' | null
          avatar_url?: string | null
          classroom?: string | null
          phone?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          role?: 'teacher' | 'student' | 'admin'
          full_name?: string
          grade?: 'ม.1' | 'ม.2' | 'ม.3' | 'ป.4' | 'ป.5' | null
          avatar_url?: string | null
          classroom?: string | null
          phone?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          due_date: string | null
          grade: 'ม.1' | 'ม.2' | 'ม.3' | 'ป.4' | 'ป.5' | null
          subject: string | null
          teacher_id: string
          course_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          due_date?: string | null
          grade?: 'ม.1' | 'ม.2' | 'ม.3' | 'ป.4' | 'ป.5' | null
          subject?: string | null
          teacher_id: string
          course_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          grade?: 'ม.1' | 'ม.2' | 'ม.3' | 'ป.4' | 'ป.5' | null
          subject?: string | null
          teacher_id?: string
          course_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      topics: {
        Row: { id: string; course_id: string; title: string; topic_order: number; created_at: string }
        Insert: { id?: string; course_id: string; title: string; topic_order?: number; created_at?: string | null }
        Update: { id?: string; course_id?: string; title?: string; topic_order?: number; created_at?: string | null }
        Relationships: [{ foreignKeyName: "topics_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] }]
      }
      content_items: {
        Row: { id: string; topic_id: string; title: string; description: string | null; type: string; url: string | null; file_path: string | null; item_order: number; created_at: string }
        Insert: { id?: string; topic_id: string; title: string; description?: string | null; type: string; url?: string | null; file_path?: string | null; item_order?: number; created_at?: string | null }
        Update: { id?: string; topic_id?: string; title?: string; description?: string | null; type?: string; url?: string | null; file_path?: string | null; item_order?: number; created_at?: string | null }
        Relationships: [{ foreignKeyName: "content_items_topic_id_fkey"; columns: ["topic_id"]; isOneToOne: false; referencedRelation: "topics"; referencedColumns: ["id"] }]
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          text_content: string | null
          file_url: string | null
          file_name: string | null
          status: 'submitted' | 'graded'
          grade: number | null
          feedback: string | null
          ai_feedback: string | null
          submitted_at: string
          graded_at: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          text_content?: string | null
          file_url?: string | null
          file_name?: string | null
          status?: 'submitted' | 'graded'
          grade?: number | null
          feedback?: string | null
          ai_feedback?: string | null
          submitted_at?: string | null
          graded_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          text_content?: string | null
          file_url?: string | null
          file_name?: string | null
          status?: 'submitted' | 'graded'
          grade?: number | null
          feedback?: string | null
          ai_feedback?: string | null
          submitted_at?: string | null
          graded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      quizzes: {
        Row: { id: string; course_id: string; topic_id: string | null; title: string; description: string | null; status: 'draft' | 'open' | 'closed'; created_at: string }
        Insert: { id?: string; course_id: string; topic_id?: string | null; title: string; description?: string | null; status?: 'draft' | 'open' | 'closed'; created_at?: string | null }
        Update: { id?: string; course_id?: string; topic_id?: string | null; title?: string; description?: string | null; status?: 'draft' | 'open' | 'closed'; created_at?: string | null }
        Relationships: [{ foreignKeyName: "quizzes_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] }]
      }
      quiz_questions: {
        Row: { id: string; quiz_id: string; question_text: string; points: number; question_order: number; created_at: string }
        Insert: { id?: string; quiz_id: string; question_text: string; points?: number; question_order?: number; created_at?: string | null }
        Update: { id?: string; quiz_id?: string; question_text?: string; points?: number; question_order?: number; created_at?: string | null }
        Relationships: [{ foreignKeyName: "quiz_questions_quiz_id_fkey"; columns: ["quiz_id"]; isOneToOne: false; referencedRelation: "quizzes"; referencedColumns: ["id"] }]
      }
      quiz_choices: {
        Row: { id: string; question_id: string; choice_text: string; is_correct: boolean; choice_order: number }
        Insert: { id?: string; question_id: string; choice_text: string; is_correct?: boolean; choice_order?: number }
        Update: { id?: string; question_id?: string; choice_text?: string; is_correct?: boolean; choice_order?: number }
        Relationships: [{ foreignKeyName: "quiz_choices_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "quiz_questions"; referencedColumns: ["id"] }]
      }
      quiz_attempts: {
        Row: { id: string; quiz_id: string; student_id: string; score: number; total_possible: number; submitted_at: string; created_at: string }
        Insert: { id?: string; quiz_id: string; student_id: string; score: number; total_possible: number; submitted_at?: string | null; created_at?: string | null }
        Update: { id?: string; quiz_id?: string; student_id?: string; score?: number; total_possible?: number; submitted_at?: string | null; created_at?: string | null }
        Relationships: [
          { foreignKeyName: "quiz_attempts_quiz_id_fkey"; columns: ["quiz_id"]; isOneToOne: false; referencedRelation: "quizzes"; referencedColumns: ["id"] },
          { foreignKeyName: "quiz_attempts_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      quiz_answers: {
        Row: { id: string; attempt_id: string; question_id: string; chosen_choice_id: string }
        Insert: { id?: string; attempt_id: string; question_id: string; chosen_choice_id: string }
        Update: { id?: string; attempt_id?: string; question_id?: string; chosen_choice_id?: string }
        Relationships: [
          { foreignKeyName: "quiz_answers_attempt_id_fkey"; columns: ["attempt_id"]; isOneToOne: false; referencedRelation: "quiz_attempts"; referencedColumns: ["id"] },
          { foreignKeyName: "quiz_answers_chosen_choice_id_fkey"; columns: ["chosen_choice_id"]; isOneToOne: false; referencedRelation: "quiz_choices"; referencedColumns: ["id"] },
          { foreignKeyName: "quiz_answers_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "quiz_questions"; referencedColumns: ["id"] }
        ]
      }
      notifications: {
        Row: { id: string; user_id: string; type: 'assignment_created' | 'content_added' | 'quiz_open'; title: string; body: string | null; link: string | null; is_read: boolean; created_at: string }
        Insert: { id?: string; user_id: string; type: 'assignment_created' | 'content_added' | 'quiz_open'; title: string; body?: string | null; link?: string | null; is_read?: boolean; created_at?: string | null }
        Update: { id?: string; user_id?: string; type?: 'assignment_created' | 'content_added' | 'quiz_open'; title?: string; body?: string | null; link?: string | null; is_read?: boolean; created_at?: string | null }
        Relationships: [{ foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
