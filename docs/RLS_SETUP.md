# Supabase RLS (Row Level Security) 設定ガイド

## 🚨 問題

`users` テーブルへの INSERT が RLS ポリシーによってブロックされています。

```
Error: "new row violates row-level security policy for table \"users\""
```

## 🚀 クイック解決（推奨・2 分で完了）

### ステップ 1: Supabase ダッシュボードにアクセス

https://supabase.com/ にログインしてプロジェクトを選択

### ステップ 2: SQL Editor を開く

左メニュー → **"SQL Editor"** をクリック

### ステップ 3: SQL を実行

以下を新しいクエリにコピーして、**「Run」ボタン**（または Ctrl+Enter）を押す：

```sql
-- 既存のポリシーをクリア
DROP POLICY IF EXISTS "Allow insert" ON users;
DROP POLICY IF EXISTS "Allow select" ON users;
DROP POLICY IF EXISTS "Allow update" ON users;
DROP POLICY IF EXISTS "Allow delete" ON users;

-- RLS を完全に無効化（開発環境）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### ステップ 4: ブラウザをリロード

F5 キーを押すか、リロードボタンをクリック

### ✅ 確認

ブラウザコンソールで以下のログが表示されれば成功：

```
✅ ensureUserProfile: new user profile created: {...}
```

---

## 詳細解決方法

### 方法 A: テーブルエディタから（GUI）

1. Supabase ダッシュボール → **"Table Editor"**
2. 左メニューから `users` テーブルを選択
3. 右上の **"Edit table"** をクリック
4. **"Enable RLS"** トグルを **オフ** にする
5. 保存してページをリロード

### 方法 B: RLS ポリシーを設定（本番環境推奨）

```sql
-- RLS を有効にしてポリシーを設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert" ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow select" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow update" ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete" ON users
  FOR DELETE
  USING (true);
```

---

## 🔍 トラブルシューティング

### エラーが解決しない場合

1. **ブラウザキャッシュをクリア**  
   Ctrl+Shift+Delete → "キャッシュされた画像とファイル" を選択 → クリア

2. **Supabase で実際に RLS が無効化されているか確認**  
   Table Editor → users → 右上を確認（RLS: Disabled と表示）

3. **アプリケーションを再起動**  
   ターミナルで `npm run dev` を実行

### SQL 実行時にエラーが出た場合

-   コピペ時に特殊文字が混在していないか確認
-   Supabase コンソールのエラーメッセージを読む
-   SQL Editor の「Clear」ボタンでクエリをリセットして再度実行

### テーブルが見つからない場合

Table Editor で `users` テーブルが存在するか確認してください。  
存在しない場合は、Supabase ダッシュボール → "SQL Editor" で以下を実行：

```sql
CREATE TABLE users (
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

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## ℹ️ 参考情報

-   **RLS（Row Level Security）**: データベースのセキュリティ機能で、ポリシーに基づいて行へのアクセスを制限
-   **開発環境**: RLS を無効化して開発速度を優先
-   **本番環境**: 適切なポリシーを設定してセキュリティを確保
