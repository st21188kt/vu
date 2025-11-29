# 📌 緊急: Supabase セットアップ確認

## ステップ 1: Supabase ダッシュボードで SQL を実行

1. https://supabase.com にログイン
2. プロジェクトを選択
3. 左メニュー → **"SQL Editor"**
4. **"+ New Query"** をクリック
5. 以下を貼り付けて実行

```sql
-- テーブルが存在するか確認
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('users', 'activities', 'likes');
```

**結果**:

-   ✅ 3 つすべてが表示される → テーブル作成済み
-   ❌ 何も表示されない、または少ないもの → 以下を実行

---

## ステップ 2: テーブルが存在しない場合（テーブル作成）

```sql
-- ========== テーブル作成 ==========

-- 1. users テーブル
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

CREATE INDEX idx_users_user_id ON users(user_id);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. activities テーブル
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- 3. likes テーブル
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

CREATE INDEX idx_likes_activity_id ON likes(activity_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
```

---

## ステップ 3: 実行して確認

**SQL 実行後**:

1. ブラウザで F5 キーを押してリロード
2. コンソール（F12）を開く
3. アクティビティを追加してみる
4. コンソールに以下のようなログが表示されているか確認:
    ```
    Feed: loadActivities called, userId: xxx
    Feed: fetchAllActivities returned: [...]
    ```

---

## ⚠️ よくあるエラー

### "テーブルが見つかりません"

→ テーブル作成スクリプトを実行してください

### "RLS ポリシーによってブロックされている"

→ `ALTER TABLE xxx DISABLE ROW LEVEL SECURITY;` を実行

### "アクティビティを追加してもすぐに見つからない"

→ ブラウザを F5 でリロード
