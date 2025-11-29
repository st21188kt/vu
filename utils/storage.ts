import { GenreScore } from '@/types/genre'

/**
 * GenreScore配列（要素数4）をlocalStorageに保存する
 * @param key - ローカルストレージのキー
 * @param genreScores - GenreScore配列（要素数は4つであること）
 */
export const saveGenreScores = (key: string, genreScores: GenreScore[]): void => {
  if (typeof window === 'undefined') return;

  if (genreScores.length !== 4) {
    console.error('GenreScore配列の要素数は4である必要があります');
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(genreScores));
  } catch (error) {
    console.error(`GenreScoreの保存に失敗しました: ${key}`, error);
  }
};

/**
 * localStorageからGenreScore配列（要素数4）を取得する
 * @param key - ローカルストレージのキー
 * @param defaultValue - データが存在しない場合のデフォルト値
 * @returns GenreScore配列（要素数4）
 */
export const loadGenreScores = (key: string, defaultValue: GenreScore[] | null = null): GenreScore[] | null => {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return defaultValue;

    const parsed = JSON.parse(item) as GenreScore[];

    // 要素数が4であることを確認
    if (Array.isArray(parsed) && parsed.length === 4) {
      return parsed;
    }

    console.error('保存されたGenreScore配列の形式が不正です');
    return defaultValue;
  } catch (error) {
    console.error(`GenreScoreの取得に失敗しました: ${key}`, error);
    return defaultValue;
  }
};

/**
 * GenreScoresをlocalStorageから削除する
 * @param key - ローカルストレージのキー
 */
export const removeGenreScores = (key: string): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`GenreScoresの削除に失敗しました: ${key}`, error);
  }
};

/**
 * ユーザーの提案履歴（過去10件）を保存する
 * @param userId - ユーザーID
 * @param suggestion - 提案文
 */
export const saveSuggestionHistory = (userId: string, suggestion: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const key = `suggestionHistory_${userId}`;
    const history = loadSuggestionHistory(userId) || [];

    // 新しい提案を追加して、最新10件のみ保持
    const updated = [suggestion, ...history].slice(0, 10);
    window.localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error(`提案履歴の保存に失敗しました: ${userId}`, error);
  }
};

/**
 * ユーザーの提案履歴（過去10件）を取得する
 * @param userId - ユーザーID
 * @returns 提案文の配列（最大10件）
 */
export const loadSuggestionHistory = (userId: string): string[] | null => {
  if (typeof window === 'undefined') return null;

  try {
    const key = `suggestionHistory_${userId}`;
    const item = window.localStorage.getItem(key);
    if (item === null) return null;

    const parsed = JSON.parse(item) as string[];

    // 配列であることを確認
    if (Array.isArray(parsed)) {
      return parsed;
    }

    console.error('保存された提案履歴の形式が不正です');
    return null;
  } catch (error) {
    console.error(`提案履歴の取得に失敗しました: ${userId}`, error);
    return null;
  }
};



// 使用例

// import { saveGenreScores, loadGenreScores, removeGenreScores } from '@/utils/storage'
// import { GenreScore } from '@/types/genre'

// 例1: GenreScore配列を保存する
// const genreScores: GenreScore[] = [
//   { key: 'RELAX', value: 0.5 },
//   { key: 'MOVE', value: 0.3 },
//   { key: 'CREATIVE', value: 0.1 },
//   { key: 'MUSIC', value: 0.1 },
// ]
// saveGenreScores('userGenreScores', genreScores)

// 例2: 保存したGenreScore配列を取得する
// const loaded = loadGenreScores('userGenreScores')
// console.log(loaded) // { key: 'RELAX', value: 0.5 }, ...

// 例3: デフォルト値を指定して取得する
// const defaultScores: GenreScore[] = [
//   { key: 'RELAX', value: 0 },
//   { key: 'MOVE', value: 0 },
//   { key: 'CREATIVE', value: 0 },
//   { key: 'MUSIC', value: 0 },
// ]
// const loaded2 = loadGenreScores('userGenreScores', defaultScores)

// 例4: 保存したデータを削除する
// removeGenreScores('userGenreScores')