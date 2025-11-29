# 🔧 クイック トラブルシューティング

## 問題の確認方法

1. **ブラウザを開く** → http://localhost:3000
2. **F12 キーを押す** （開発ツール）
3. **Console タブを見る**
4. アクティビティを作成して、以下のログが出ているか確認:

```
Feed: loadActivities called, userId: xxx
Feed: fetchAllActivities returned: [...]
```

---

## よくある状況と解決方法

### ❌ `fetchAllActivities returned: []` （空配列が返される）

**原因**: activities テーブルが存在していない、またはデータが保存されていない

**解決**:

1. https://supabase.com にログイン
2. **SQL Editor** を開く
3. **"+ New Query"** をクリック
4. 以下を実行して確認:

```sql
-- テーブルの存在確認
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**テーブルがない場合** → [URGENT_SETUP.md](./URGENT_SETUP.md) のセットアップスクリプトを実行

---

### ❌ アクティビティ作成後、「あなた」タブに表示されない

**コンソールに以下が表示されているか確認**:

```
ActivityRequestModal: creating activity with userId: xxx
ActivityRequestModal: createActivity result: {...}
ActivityRequestModal: dispatching activityCreated event
```

-   ✅ すべて表示 → データは保存されている（ページ F5 でリロードで表示される）
-   ❌ `result: null` → createActivity に失敗している
-   ❌ ログが表示されない → activity-request-modal.tsx がレンダリングされていない

---

### ❌ アカウント画面で「よく実行するジャンル」が表示されない

**原因**: `users` テーブルの `most_frequent_genre` フィールドが NULL

**確認方法** (SQL):

```sql
SELECT id, user_id, most_frequent_genre FROM users LIMIT 5;
```

-   ✅ `most_frequent_genre` に値がある（MOVE など） → OK
-   ❌ すべて NULL → アクティビティの `genre` が正しく保存されていない

---

## デバッグログの読み方

### Feed コンポーネント

```
Feed: loadActivities called, userId: 550e8400-e29b-41d4-a716-446655440000
Feed: fetchAllActivities returned: [
  {
    id: "abc123",
    userId: "550e8400-e29b-41d4-a716-446655440000",
    text: "10分走った",
    category: "MOVE",
    ...
  }
]
```

-   ✅ `returned: [...]` で複数のアクティビティが返されている → 正常
-   ❌ `returned: []` → テーブルが空またはクエリが間違っている

---

## 💻 コンソールコマンド

ブラウザのコンソールで実行可能:

```javascript
// localStorage に保存されている userId を確認
localStorage.getItem("userId");

// 出力: "550e8400-e29b-41d4-a716-446655440000"
```

---

## 次のステップ

1. コンソールログを確認
2. ログに基づいて問題を特定
3. SQL で Supabase を確認
4. 必要に応じてテーブルを再作成
5. ページをリロード (F5)
