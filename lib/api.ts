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
  { name: 'チャレンジャー', minCount: 5, color: 'from-green-400 to-emerald-500' },
  { name: 'アクティブ', minCount: 15, color: 'from-blue-400 to-cyan-500' },
  { name: 'エキスパート', minCount: 30, color: 'from-purple-400 to-pink-500' },
  { name: 'マスター', minCount: 50, color: 'from-yellow-400 to-orange-500' },
  { name: 'レジェンド', minCount: 100, color: 'from-rose-400 to-red-500' },
]

export const categoryIcons: Record<GenreType, { icon: string; color: string; label: string }> = {
  MOVE: { icon: '🏃', color: 'from-green-400 to-emerald-500', label: '動く' },
  RELAX: { icon: '🧘', color: 'from-purple-400 to-violet-500', label: 'リラックス' },
  CREATIVE: { icon: '🎨', color: 'from-cyan-400 to-teal-500', label: 'クリエイティブ' },
  MUSIC: { icon: '🎵', color: 'from-pink-400 to-rose-500', label: '音楽' },
}

export const avatarColorOptions = [
  { id: 0, label: 'グレイ', icon: '⚫', outer: 'from-gray-400 to-gray-500', inner: 'from-gray-500 to-gray-600' },
  { id: 1, label: 'グリーン', icon: '💚', outer: 'from-green-400 to-emerald-500', inner: 'from-green-500 to-emerald-600' },
  { id: 2, label: 'ブルー', icon: '💙', outer: 'from-blue-400 to-cyan-500', inner: 'from-blue-500 to-cyan-600' },
  { id: 3, label: 'パープル', icon: '💜', outer: 'from-purple-400 to-pink-500', inner: 'from-purple-500 to-pink-600' },
  { id: 4, label: 'オレンジ', icon: '🧡', outer: 'from-orange-400 to-red-500', inner: 'from-orange-500 to-red-600' },
  { id: 5, label: 'ピンク', icon: '🌸', outer: 'from-pink-400 to-rose-500', inner: 'from-pink-500 to-rose-600' },
]

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
    console.error('Failed to fetch activities:', error)
    return []
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
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
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

    // activity_count を更新
    const { error: updateError } = await supabase
      .from('users')
      .update({ activity_count: (userData.activity_count || 0) + 1 })
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
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
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
