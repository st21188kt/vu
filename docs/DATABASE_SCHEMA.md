# Supabase データベーススキーマ

## テーブル構成

### 1. `users` テーブル

ユーザープロフィール情報を管理します。

```sql
CREATE TABLE users (
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

-- インデックス
CREATE INDEX idx_users_user_id ON users(user_id);

-- RLS を無効化（開発環境）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### 2. `activities` テーブル

ユーザーが実行したアクティビティを管理します。

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- RLS を無効化（開発環境）
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
```

### 3. `likes` テーブル

アクティビティへのいいねを管理します。

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- インデックス
CREATE INDEX idx_likes_activity_id ON likes(activity_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- RLS を無効化（開発環境）
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
```

## セットアップ手順

### 1. Supabase ダッシュボードにアクセス

https://supabase.com/ にログインしてプロジェクトを選択

### 2. SQL Editor を開く

左メニュー → **"SQL Editor"** をクリック

### 3. 各テーブルを作成

上記の SQL をコピーして実行してください。

#### ステップ A: `users` テーブル

```sql
CREATE TABLE users (
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
```

#### ステップ B: `activities` テーブル

```sql
CREATE TABLE activities (
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
```

#### ステップ C: `likes` テーブル

```sql
CREATE TABLE likes (
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

### 4. ブラウザをリロード

F5 キーを押すか、リロードボタンをクリック

### 5. アプリケーションを再起動

```bash
npm run dev
```

## トラブルシューティング

### エラー: テーブルが既に存在する

テーブルを削除して再作成してください：

```sql
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

その後、上記のセットアップ手順を再実行してください。

### エラー: 外部キー制約エラー

`CASCADE` オプションを確認してください。削除時に関連レコードも削除するようになっています。

### ユーザーが作成されない場合

1. ブラウザのコンソール（F12）でエラーを確認
2. Supabase ダッシュボールで `users` テーブルが存在するか確認
3. RLS が無効化されているか確認
