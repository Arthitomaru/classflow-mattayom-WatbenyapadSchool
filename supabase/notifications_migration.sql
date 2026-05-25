-- ── Notification system migration ───────────────────────────────
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text         NOT NULL CHECK (type IN ('assignment_created', 'content_added', 'quiz_open')),
  title       text         NOT NULL,
  body        text,
  link        text,
  is_read     boolean      NOT NULL DEFAULT false,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Index สำหรับ query unread per user (Sidebar badge + notifications page)
CREATE INDEX IF NOT EXISTS notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- นักเรียน/ครู อ่านได้เฉพาะ notification ของตัวเอง
CREATE POLICY "users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- อนุญาตให้ user mark as read ของตัวเอง
CREATE POLICY "users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (admin client) insert notification ให้ user อื่นได้
-- INSERT ผ่าน service_role key จาก server ดังนั้นไม่ต้องมี policy สำหรับ INSERT
-- (service_role bypasses RLS)
