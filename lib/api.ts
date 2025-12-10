'use client'

import { supabase } from '@/lib/supabase'
import type { GenreType } from '@/types/genre'

/**
 * Supabase から取得したユーザー型
 */
export interface DbUser {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  outer_color_id: number
  inner_color_id: number
  most_frequent_genre: GenreType | null
  activity_count: number
  created_at: string
  updated_at: string
}

/**
 * Supabase から取得したアクティビティ型
 */
export interface DbActivity {
  id: string
  user_id: string
  genre: GenreType
  text: string
  created_at: string
  updated_at: string
  users?: DbUser  // ユーザー情報を included
  likes_count?: number  // いいね数（集計）
  is_liked_by_current_user?: boolean  // 現在ユーザーがいいねしているか
}

/**
 * Supabase から取得したいいね型
 */
export interface DbLike {
  id: string
  user_id: string
  activity_id: string
  created_at: string
}

/**
 * ローカルアプリケーション用の Activity 型
 */
export interface Activity {
  id: string
  text: string
  category: GenreType
  userId: string
  userName: string
  userAvatar: string
  userOuterColorId?: number
  userInnerColorId?: number
  createdAt: Date
  likes: number
  likedBy: string[]
}

export interface Rank {
  name: string
  minCount: number
  color: string
}

export const ranks: Rank[] = [
{ name: 'ビギナー', minCount: 0, color: 'from-gray-400 to-gray-500' },
{ name: 'チャレンジャー', minCount: 5, color: 'from-green-400 to-green-500' },
{ name: 'ベテラン', minCount: 15, color: 'from-blue-400 to-blue-500' },
{ name: 'プロ', minCount: 30, color: 'from-yellow-400 to-yellow-500' },
{ name: 'マスター', minCount: 50, color: 'from-purple-400 to-purple-500' },
{ name: 'レジェンド', minCount: 100, color: 'from-pink-400 to-pink-500' },
]

export const categoryIcons: Record<GenreType, { icon: string; color: string; label: string }> = {
  MOVE: { icon: '🏃', color: 'from-green-400 to-emerald-500', label: 'MOVE' },
  RELAX: { icon: '🧘', color: 'from-purple-400 to-violet-500', label: 'RELAX' },
  CREATIVE: { icon: '🎨', color: 'from-cyan-400 to-teal-500', label: 'CREATIVE' },
  MUSIC: { icon: '🎵', color: 'from-pink-400 to-rose-500', label: 'MUSIC' },
}

export const avatarColorOptions = [
  { id: 0, label: 'グレイ', icon: '⚫', outer: 'from-gray-400 to-gray-500', inner: 'from-gray-500 to-gray-600' },
  { id: 1, label: 'ホワイト', icon: '🤍', outer: 'from-gray-300 to-white', inner: 'from-gray-300 to-white' },
  { id: 2, label: 'イエロー', icon: '💛', outer: 'from-yellow-300 to-amber-400', inner: 'from-yellow-400 to-amber-500' },
  { id: 3, label: 'グリーン', icon: '💚', outer: 'from-green-400 to-emerald-500', inner: 'from-green-500 to-emerald-600' },
  { id: 4, label: 'ブルー', icon: '💙', outer: 'from-blue-400 to-cyan-500', inner: 'from-blue-500 to-cyan-600' },
  { id: 5, label: 'パープル', icon: '💜', outer: 'from-purple-400 to-pink-500', inner: 'from-purple-500 to-pink-600' },
  { id: 6, label: 'オレンジ', icon: '🧡', outer: 'from-orange-400 to-red-500', inner: 'from-orange-500 to-red-600' },
  { id: 7, label: 'ピンク', icon: '🌸', outer: 'from-pink-400 to-rose-500', inner: 'from-pink-500 to-rose-600' },
  { id: 8, label: 'ギャラクシー', icon: '✨', outer: 'from-indigo-700 to-black', inner: 'from-purple-700 to-black' },
  { id: 9, label: 'ドラゴンブレス', icon: '🐉', outer: 'from-red-700 to-black', inner: 'from-orange-700 to-black' },
  { id: 10, label: 'レインボー', icon: '🌈', outer: 'from-red-400 via-yellow-400 to-blue-400', inner: 'from-purple-400 via-pink-400 to-emerald-400' },
];



/**
 * Supabase からすべてのアクティビティを取得（ユーザー情報といいね数を含む）
 */
export async function fetchAllActivities(): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        user_id,
        genre,
        text,
        created_at,
        users:user_id (
          username,
          avatar_url,
          outer_color_id,
          inner_color_id
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const activities: Activity[] = (data || []).map((item: any) => ({
      id: item.id,
      text: item.text,
      category: item.genre as GenreType,
      userId: item.user_id,
      userName: item.users?.username || 'Unknown',
      userAvatar: item.users?.avatar_url || '/default-user-avatar.png',
      userOuterColorId: item.users?.outer_color_id,
      userInnerColorId: item.users?.inner_color_id,
      createdAt: new Date(item.created_at),
      likes: 0,
      likedBy: [],
    }))

    // いいね情報を取得してカウント
    for (const activity of activities) {
      const { data: likesData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('activity_id', activity.id)

      if (likesData) {
        activity.likes = likesData.length
        activity.likedBy = likesData.map((l) => l.user_id)
      }
    }

    return activities
  } catch (error) {
    console.error('Failed to fetch activities:', error instanceof Error ? error.message : JSON.stringify(error, null, 2))
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }
    return []
  }
}

/**
 * Supabase からアクティビティをページネーション付きで取得
 */
/**
 * Supabase からアクティビティをページネーション付きで取得
 */
export async function fetchActivitiesWithPagination(
  page: number,
  limit: number,
  userId?: string
): Promise<{ activities: Activity[]; hasMore: boolean }> {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('activities')
      .select(
        `
        id,
        user_id,
        genre,
        text,
        created_at,
        users:user_id (
          username,
          avatar_url,
          outer_color_id,
          inner_color_id
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error, count } = await query

    if (error) throw error

    const activities: Activity[] = (data || []).map((item: any) => ({
      id: item.id,
      text: item.text,
      category: item.genre as GenreType,
      userId: item.user_id,
      userName: item.users?.username || 'Unknown',
      userAvatar: item.users?.avatar_url || '/default-user-avatar.png',
      userOuterColorId: item.users?.outer_color_id,
      userInnerColorId: item.users?.inner_color_id,
      createdAt: new Date(item.created_at),
      likes: 0,
      likedBy: [],
    }))

    // いいね情報を取得してカウント
    for (const activity of activities) {
      const { data: likesData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('activity_id', activity.id)

      if (likesData) {
        activity.likes = likesData.length
        activity.likedBy = likesData.map((l) => l.user_id)
      }
    }

    const hasMore = (count || 0) > to + 1

    return { activities, hasMore }
  } catch (error) {
    console.error(
      'Failed to fetch activities with pagination:',
      error instanceof Error ? error.message : JSON.stringify(error, null, 2)
    )
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }
    return { activities: [], hasMore: false }
  }
}

/**
 * ユーザーがいいねしたアクティビティを取得（ページネーション付き）
 */
export async function fetchLikedActivitiesWithPagination(
  userId: string,
  page: number,
  limit: number
): Promise<{ activities: Activity[]; hasMore: boolean }> {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 0. user_id string -> users.id UUID lookup
    const { data: uData } = await supabase.from('users').select('id').eq('user_id', userId).single();
    if (!uData) return { activities: [], hasMore: false };
    const userUuid = uData.id;

    // 1. likes テーブルから対象ユーザーのいいねを取得
    const { data: likesData, error: likesError, count } = await supabase
      .from('likes')
      .select('activity_id', { count: 'exact' })
      .eq('user_id', userUuid) // Use UUID
      .order('created_at', { ascending: false })
      .range(from, to)

    if (likesError) throw likesError
    if (!likesData || likesData.length === 0) return { activities: [], hasMore: false }

    const activityIds = likesData.map(l => l.activity_id)

    // 2. activity_id リストを使ってアクティビティを取得
    // 注意: in句を使うと順序が保証されないが、いいねした順に表示したい場合は工夫が必要
    // 簡易的に created_at 順で表示するか、クライアントサイドでソートするか検討
    // ここではアクティビティ自体の新しい順で表示することにする
    const { data, error } = await supabase
      .from('activities')
      .select(
        `
                id,
                user_id,
                genre,
                text,
                created_at,
                users:user_id (
                  username,
                  avatar_url,
                  outer_color_id,
                  inner_color_id
                )
              `
      )
      .in('id', activityIds)
      .order('created_at', { ascending: false })

    if (error) throw error

    const activities: Activity[] = (data || []).map((item: any) => ({
      id: item.id,
      text: item.text,
      category: item.genre as GenreType,
      userId: item.user_id,
      userName: item.users?.username || 'Unknown',
      userAvatar: item.users?.avatar_url || '/default-user-avatar.png',
      userOuterColorId: item.users?.outer_color_id,
      userInnerColorId: item.users?.inner_color_id,
      createdAt: new Date(item.created_at),
      likes: 0,
      likedBy: [],
    }))

    // いいね情報を付加
    for (const activity of activities) {
      const { data: likesData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('activity_id', activity.id)

      if (likesData) {
        activity.likes = likesData.length
        activity.likedBy = likesData.map((l) => l.user_id)
      }
    }

    const hasMore = (count || 0) > to + 1
    return { activities, hasMore }

  } catch (error) {
    console.error('Failed to fetch liked activities:', error)
    return { activities: [], hasMore: false }
  }
}

/**
 * 自分の投稿でいいねされたものを取得（ページネーション付き）
 */
export async function fetchMyLikedActivitiesWithPagination(
  userId: string,
  page: number,
  limit: number
): Promise<{ activities: Activity[]; hasMore: boolean }> {
  console.log(`[DEBUG] fetchMyLikedActivities: userId=${userId}, page=${page}, limit=${limit}`);
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 0. user_id string -> users.id UUID lookup
    const { data: uData } = await supabase.from('users').select('id').eq('user_id', userId).single();
    if (!uData) return { activities: [], hasMore: false };
    const userUuid = uData.id;

    // likes!inner により、いいねがついているアクティビティのみを取得（Inner Join）
    // これにより、DBレベルでフィルタリングされ、正確なページネーションが可能になる
    const { data, error, count } = await supabase
      .from('activities')
      .select(`
        id,
        user_id,
        genre,
        text,
        created_at,
        users:user_id (
          username,
          avatar_url,
          outer_color_id,
          inner_color_id
        ),
        likes!inner(user_id)
      `, { count: 'exact' })
      .eq('user_id', userUuid) // Use UUID
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[DEBUG] fetchMyLikedActivities: Fetch error:', error);
      throw error;
    }

    // Activity型に変換
    const activities: Activity[] = (data || []).map((item: any) => ({
      id: item.id,
      text: item.text,
      category: item.genre as GenreType,
      userId: item.user_id,
      userName: item.users?.username || 'Unknown',
      userAvatar: item.users?.avatar_url || '/default-user-avatar.png',
      userOuterColorId: item.users?.outer_color_id,
      userInnerColorId: item.users?.inner_color_id,
      createdAt: new Date(item.created_at),
      likes: item.likes.length,
      likedBy: item.likes.map((l: any) => l.user_id),
    }));

    const hasMore = (count || 0) > to + 1;

    console.log(`[DEBUG] fetchMyLikedActivities: Fetched ${activities.length} activities. Total match: ${count}`);
    
    return { activities, hasMore };

  } catch (error) {
    console.error('Failed to fetch my liked activities:', error);
    return { activities: [], hasMore: false };
  }
}

/**
 * ユーザーの投稿を取得（ユーザー情報といいね数を含む）
 */
export async function fetchUserActivities(userId: string): Promise<Activity[]> {
  try {
    // users テーブルから user レコードを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (userError) {
      console.error('Error fetching user:', userError)
      return []
    }

    if (!userData) {
      // ユーザーが見つからない場合は空のリストを返す（エラーログは出さない）
      return []
    }

    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        user_id,
        genre,
        text,
        created_at,
        users:user_id (
          username,
          avatar_url,
          outer_color_id,
          inner_color_id
        )
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const activities: Activity[] = (data || []).map((item: any) => ({
      id: item.id,
      text: item.text,
      category: item.genre as GenreType,
      userId: item.user_id,
      userName: item.users?.username || 'Unknown',
      userAvatar: item.users?.avatar_url || '/default-user-avatar.png',
      userOuterColorId: item.users?.outer_color_id,
      userInnerColorId: item.users?.inner_color_id,
      createdAt: new Date(item.created_at),
      likes: 0,
      likedBy: [],
    }))

    // いいね情報を取得してカウント
    for (const activity of activities) {
      const { data: likesData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('activity_id', activity.id)

      if (likesData) {
        activity.likes = likesData.length
        activity.likedBy = likesData.map((l) => l.user_id)
      }
    }

    return activities
  } catch (error) {
    console.error('Failed to fetch user activities:', error)
    return []
  }
}

/**
 * アクティビティを作成
 */
export async function createActivity(
  currentUserId: string,
  text: string,
  category: GenreType
): Promise<Activity | null> {
  try {
    // users テーブルから user レコードを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, avatar_url, activity_count')
      .eq('user_id', currentUserId)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return null
    }

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: userData.id,
        genre: category,
        text,
      })
      .select()
      .single()

    if (error) {
      console.error('🚨 Failed to create activity:', error)
      console.error('📖 詳細: docs/DATABASE_SCHEMA.md を参照してください')
      console.error('📝 activities テーブルが存在するか、RLS が無効化されているか確認してください')
      throw error
    }

    // activity_count と most_frequent_genre を更新
    const newActivityCount = (userData.activity_count || 0) + 1

    // most_frequent_genre を計算（新しいアクティビティを含めて）
    const { data: allUserActivities } = await supabase
      .from('activities')
      .select('genre')
      .eq('user_id', userData.id)

    let mostFrequentGenre: GenreType | null = null
    if (allUserActivities && allUserActivities.length > 0) {
      const genreCount: Record<GenreType, number> = {
        RELAX: 0,
        MOVE: 0,
        CREATIVE: 0,
        MUSIC: 0,
      }
      allUserActivities.forEach((activity: any) => {
        genreCount[activity.genre as GenreType]++
      })

      let maxCount = 0
      Object.entries(genreCount).forEach(([genre, count]) => {
        if (count > maxCount) {
          maxCount = count
          mostFrequentGenre = genre as GenreType
        }
      })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        activity_count: newActivityCount,
        most_frequent_genre: mostFrequentGenre,
      })
      .eq('id', userData.id)

    if (updateError) {
      console.error('Failed to update activity count:', updateError)
    }

    return {
      id: data.id,
      text: data.text,
      category: data.genre as GenreType,
      userId: userData.id,
      userName: userData.username,
      userAvatar: userData.avatar_url || '/default-user-avatar.png',
      createdAt: new Date(data.created_at),
      likes: 0,
      likedBy: [],
    }
  } catch (error) {
    console.error('Failed to create activity:', error)
    return null
  }
}

/**
 * いいねを追加
 */
export async function addLike(currentUserId: string, activityId: string): Promise<boolean> {
  try {
    // users テーブルから user レコードを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', currentUserId)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return false
    }

    const { error } = await supabase.from('likes').insert({
      user_id: userData.id,
      activity_id: activityId,
    })

    if (error) {
      // 重複キーエラーの場合はスキップ
      if (error.code === '23505') {
        console.log('Like already exists for this activity')
        return true
      }
      console.error('Failed to add like. Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      throw error
    }
    return true
  } catch (error) {
    console.error('Failed to add like:', error)
    return false
  }
}

/**
 * いいねを削除
 */
export async function removeLike(currentUserId: string, activityId: string): Promise<boolean> {
  try {
    // users テーブルから user レコードを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', currentUserId)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return false
    }

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userData.id)
      .eq('activity_id', activityId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to remove like:', error)
    return false
  }
}

/**
 * ユーザープロフィールを取得
 */
export async function fetchUserProfile(userId: string): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Failed to fetch user profile:', error instanceof Error ? error.message : JSON.stringify(error, null, 2))
    return null
  }
}

/**
 * ユーザープロフィールを作成
 */
export async function createUserProfile(userId: string, username: string): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        username,
        avatar_url: null,
        activity_count: 0,
      })
      .select()
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Failed to create user profile:', error)
    return null
  }
}

/**
 * ユーザープロフィールを更新
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<DbUser>
): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Failed to update user profile:', error)
    return null
  }
}

/**
 * ユーザーの最も頻繁なジャンルを取得
 */
export async function getMostFrequentGenre(userId: string): Promise<GenreType | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (userError || !userData) return null

    const { data, error } = await supabase
      .from('activities')
      .select('genre')
      .eq('user_id', userData.id)

    if (error) throw error

    if (!data || data.length === 0) return null

    const genreCount: Record<GenreType, number> = {
      RELAX: 0,
      MOVE: 0,
      CREATIVE: 0,
      MUSIC: 0,
    }

    data.forEach((activity: any) => {
      genreCount[activity.genre as GenreType]++
    })

    let maxGenre: GenreType = 'RELAX'
    let maxCount = 0
    Object.entries(genreCount).forEach(([genre, count]) => {
      if (count > maxCount) {
        maxCount = count
        maxGenre = genre as GenreType
      }
    })

    return maxCount > 0 ? maxGenre : null
  } catch (error) {
    console.error('Failed to get most frequent genre:', error)
    return null
  }
}

/**
 * ランク情報を取得
 */
export function getCurrentRank(activityCount: number): Rank {
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (activityCount >= ranks[i].minCount) {
      return ranks[i]
    }
  }
  return ranks[0]
}

/**
 * 次のランク情報を取得
 */
export function getNextRankInfo(activityCount: number): { nextRank: Rank | null; remaining: number } {
  const currentRank = getCurrentRank(activityCount)
  const currentIndex = ranks.findIndex((r) => r.name === currentRank.name)

  if (currentIndex === ranks.length - 1) {
    return { nextRank: null, remaining: 0 }
  }

  const nextRank = ranks[currentIndex + 1]
  return { nextRank, remaining: nextRank.minCount - activityCount }
}

/**
 * ユーザーのカラー設定を更新
 */
export async function updateUserColors(userId: string, outerColorId: number, innerColorId: number) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        outer_color_id: outerColorId,
        inner_color_id: innerColorId,
      })
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to update user colors:', error)
    return false
  }
}

/**
 * アバター画像をアップロード
 */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    
    // プロフィールも更新
    await updateUserProfile(userId, { avatar_url: data.publicUrl })
    
    return data.publicUrl
  } catch (error) {
    console.error('Failed to upload avatar:', error)
    return null
  }
}

/**
 * アップロード済み画像を取得
 */
export async function fetchUploadedImages(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .list(userId)

    if (error) throw error

    return (data || []).map(file => {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/${file.name}`)
      return urlData.publicUrl
    })
  } catch (error) {
    console.error('Failed to fetch uploaded images:', error)
    return []
  }
}
