# Supabase Database Schema

## Tables

### 1. users
ユーザープロフィール情報を保存します。

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,  -- Supabase Auth の UUID または カスタムID
  username TEXT NOT NULL,
  avatar_url TEXT,
  outer_color_id INTEGER DEFAULT 0,  -- アイコンの外側の色 ID
  inner_color_id INTEGER DEFAULT 0,  -- アイコンの内側の色 ID
  most_frequent_genre TEXT DEFAULT NULL,  -- 最も出やすいジャンル (RELAX, MOVE, CREATIVE, MUSIC)
  activity_count INTEGER DEFAULT 0,  -- 実行したアクティビティ回数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. activities
アクティビティ情報を保存します。

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,  -- RELAX, MOVE, CREATIVE, MUSIC
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_genre ON activities(genre);
```

### 3. likes
いいね情報を保存します。

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, activity_id)
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_activity_id ON likes(activity_id);
```

## RLS (Row Level Security) Policies

### users テーブル
- SELECT: 全員が読み取り可能
- INSERT: 認証済みユーザーのみ、自分のレコードのみ挿入可能
- UPDATE: 認証済みユーザーが自分のレコードのみ更新可能

### activities テーブル
- SELECT: 全員が読み取り可能
- INSERT: 認証済みユーザーのみ、自分のアクティビティのみ作成可能
- UPDATE/DELETE: オーナーのみ

### likes テーブル
- SELECT: 全員が読み取り可能
- INSERT: 認証済みユーザーのみ挿入可能
- DELETE: オーナーのみ削除可能
