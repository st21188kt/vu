-- Supabase Database Schema
-- Tables for the Vu Activity Tracking Application

-- 1. users table
-- ユーザープロフィール情報を保存します。
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  outer_color_id INTEGER DEFAULT 0,
  inner_color_id INTEGER DEFAULT 0,
  most_frequent_genre TEXT DEFAULT NULL,
  activity_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. activities table
-- アクティビティ情報を保存します。
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_genre ON activities(genre);

-- 3. likes table
-- いいね情報を保存します。
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_activity_id ON likes(activity_id);

-- RLS (Row Level Security) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- users RLS Policies
-- SELECT: 全員が読み取り可能
CREATE POLICY "Users can read all user profiles" ON users
  FOR SELECT USING (true);

-- INSERT: 認証済みユーザーのみ、自分のレコードのみ挿入可能
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- UPDATE: 認証済みユーザーが自分のレコードのみ更新可能
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- activities RLS Policies
-- SELECT: 全員が読み取り可能
CREATE POLICY "Everyone can read activities" ON activities
  FOR SELECT USING (true);

-- INSERT: 認証済みユーザーのみ、自分のアクティビティのみ作成可能
CREATE POLICY "Users can create their own activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.user_id = auth.uid()::text
    )
  );

-- UPDATE/DELETE: オーナーのみ
CREATE POLICY "Users can update their own activities" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own activities" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.user_id = auth.uid()::text
    )
  );

-- likes RLS Policies
-- SELECT: 全員が読み取り可能
CREATE POLICY "Everyone can read likes" ON likes
  FOR SELECT USING (true);

-- INSERT: 認証済みユーザーのみ挿入可能
CREATE POLICY "Users can create likes" ON likes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = likes.user_id 
      AND users.user_id = auth.uid()::text
    )
  );

-- DELETE: オーナーのみ削除可能
CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = likes.user_id 
      AND users.user_id = auth.uid()::text
    )
  );
