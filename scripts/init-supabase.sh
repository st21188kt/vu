#!/bin/bash

# Supabase データベース初期化スクリプト
# このスクリプトはローカルで実行して、Supabase に必要なテーブルを作成します

echo "🚀 Supabase データベース初期化を開始します..."
echo ""
echo "以下の手順に従ってください："
echo ""
echo "1. https://supabase.com にアクセスしてログイン"
echo "2. プロジェクトを選択"
echo "3. 左メニューから 'SQL Editor' をクリック"
echo "4. 以下の SQL をコピーして実行してください"
echo ""
echo "==================================================="
echo "【SQL スクリプト】"
echo "==================================================="
echo ""

cat << 'EOF'
-- ========================================
-- 1. users テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL DEFAULT 'ユーザー',
  avatar_url TEXT,
  outer_color_id INTEGER DEFAULT 0,
  inner_color_id INTEGER DEFAULT 3,
  most_frequent_genre TEXT DEFAULT NULL,
  activity_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. activities テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. likes テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_activity_id ON likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;

-- 成功確認
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='users') as users_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='activities') as activities_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='likes') as likes_table;
EOF

echo ""
echo "==================================================="
echo ""
echo "✅ SQL をコピーして Supabase SQL Editor で実行してください"
echo "❓ 質問:"
echo "   - テーブルが既に存在する場合はスキップされます"
echo "   - エラーが出た場合は以下を確認してください:"
echo "     1. Supabase プロジェクトが正しく選択されているか"
echo "     2. SQL に特殊文字が混在していないか"
echo "3. 実行後、ブラウザをリロードしてアプリケーションを再起動してください"
echo ""
