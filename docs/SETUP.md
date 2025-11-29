# 🚀 アプリケーションセットアップガイド

## ⚠️ エラーが出ている場合

### エラー 1: "object is not iterable"

**原因**: `useUser()` フックの使用方法が間違っている

**解決**: ✅ 修正済み - `likes-page.tsx` で配列分解から オブジェクト分解に変更しました

### エラー 2: アクティビティが追加されない

**原因**: Supabase に `activities` テーブルが存在しない、または RLS ポリシーがブロックしている

**解決手順**:

## 📋 セットアップ手順（初回のみ）

### ステップ 1: 環境変数を確認

`.env.local` ファイルが以下を含んでいるか確認してください：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **💡 取得方法**: Supabase ダッシュボール → Settings → API Keys

### ステップ 2: Supabase にテーブルを作成

#### 📌 重要: 以下の SQL を実行してください

1. https://supabase.com にログイン
2. プロジェクトを選択
3. 左メニューから **"SQL Editor"** をクリック
4. **「+ New query」** ボタンをクリック
5. 以下のすべての SQL をコピーして貼り付ける

```sql
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
```

6. **「Run」ボタン** をクリック（または Ctrl+Enter）

### ステップ 3: 確認

SQL 実行後、以下のメッセージが表示されれば成功：

```
Query returned successfully with no rows
```

または

```
CREATE TABLE  ✓
```

### ステップ 4: アプリケーションを再起動

```bash
npm run dev
```

### ステップ 5: ブラウザをリロード

```
F5 キーを押してリロード
```

## ✅ 動作確認

以下の流れでテストしてください：

1. **ホームページが表示される** → OK ✅
2. **「あなた」タブに移動** → OK ✅
3. **「+」ボタンでアクティビティを追加** → OK ✅
4. **アクティビティが「あなた」タブに表示される** → OK ✅
5. **他のユーザー（別ウィンドウで新規ユーザー）のアクティビティに「いいね」できる** → OK ✅
6. **「いいね」タブでいいねした投稿が表示される** → OK ✅

## 🐛 トラブルシューティング

### Q: アクティビティを追加してもホームページに表示されない

**A**: ブラウザの開発者ツール（F12）を開いて、コンソール出力を確認してください

```javascript
// コンソールに以下が表示されていたら activities テーブルの問題
🚨 Failed to create activity: ...
📖 詳細: docs/DATABASE_SCHEMA.md を参照してください
```

**解決方法**:

1. Supabase SQL Editor を開く
2. 上記のセットアップ手順でテーブルを再作成
3. ブラウザをリロード

### Q: "new row violates row-level security policy" エラーが出ている

**A**: RLS ポリシーが有効になっています

**解決方法**:

1. Supabase → SQL Editor
2. 以下を実行：

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
```

3. ブラウザをリロード

### Q: テーブルが存在しないエラー

**A**: テーブルが未作成です

**解決方法**:

1. Supabase → Table Editor
2. 以下のテーブルが表示されているか確認:
    - `users`
    - `activities`
    - `likes`
3. 表示されない場合は、上記のセットアップ手順を実行

### Q: ユーザープロフィールが作成されない

**A**: `users` テーブルに権限がありません

**解決方法**:

1. Supabase → Table Editor → `users`
2. 右上の **"Edit table"** → **"Enable RLS"** トグルが **オフ** か確認
3. オンの場合は **オフ** に変更
4. ブラウザをリロード

## 📚 その他のドキュメント

-   [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - テーブル構成の詳細
-   [RLS_SETUP.md](./RLS_SETUP.md) - RLS 設定ガイド
