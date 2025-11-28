"use client"

import { useSyncExternalStore } from "react"
import type { GenreType } from "@/types/genre"
import { selectGenre } from "@/utils/selection"
import { genreBandit, initializeGenreScores } from "@/utils/genreBandit"
import { loadGenreScores, saveGenreScores } from "@/utils/storage"

export interface Activity {
  id: string
  text: string
  category: GenreType
  userId: string
  userName: string
  userAvatar: string
  userAvatarOuterColor?: string
  userAvatarInnerColor?: string
  createdAt: Date
  likes: number
  likedBy: string[]
}

export interface Rank {
  name: string
  minCount: number
  color: string
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  avatarOuterColor: string
  avatarInnerColor: string
}

export const ranks: Rank[] = [
  { name: "ビギナー", minCount: 0, color: "from-gray-400 to-gray-500" },
  { name: "チャレンジャー", minCount: 5, color: "from-green-400 to-emerald-500" },
  { name: "アクティブ", minCount: 15, color: "from-blue-400 to-cyan-500" },
  { name: "エキスパート", minCount: 30, color: "from-purple-400 to-pink-500" },
  { name: "マスター", minCount: 50, color: "from-yellow-400 to-orange-500" },
  { name: "レジェンド", minCount: 100, color: "from-rose-400 to-red-500" },
]

export const activitySuggestions: Array<{ text: string; category: GenreType; icon: string }> = [
  { text: "散歩に出かける", category: "MOVE", icon: "🚶" },
  { text: "15分瞑想する", category: "RELAX", icon: "🧘" },
  { text: "写真を撮りに行く", category: "CREATIVE", icon: "📷" },
  { text: "日記を書く", category: "CREATIVE", icon: "✍️" },
  { text: "新しい音楽を聴く", category: "MUSIC", icon: "🎵" },
  { text: "映画を観る", category: "RELAX", icon: "🎬" },
  { text: "絵を描く", category: "CREATIVE", icon: "🎨" },
  { text: "ストレッチをする", category: "MOVE", icon: "🤸" },
  { text: "夜空を眺める", category: "RELAX", icon: "🌙" },
  { text: "ジョギングをする", category: "MOVE", icon: "🏃" },
  { text: "瞑想音楽を聴く", category: "MUSIC", icon: "🎧" },
  { text: "ダンスをする", category: "MOVE", icon: "💃" },
  { text: "楽器を練習する", category: "MUSIC", icon: "🎸" },
  { text: "創作活動をする", category: "CREATIVE", icon: "🖌️" },
  { text: "リラックスティーを飲む", category: "RELAX", icon: "🍵" },
  { text: "ハイキングに行く", category: "MOVE", icon: "🥾" },
  { text: "ヨガをする", category: "MOVE", icon: "🤸‍♀️" },
  { text: "音声録音をする", category: "MUSIC", icon: "🎤" },
]

export const categoryIcons: Record<GenreType, { icon: string; color: string; label: string }> = {
  MOVE: { icon: "🏃", color: "from-green-400 to-emerald-500", label: "動く" },
  RELAX: { icon: "🧘", color: "from-purple-400 to-violet-500", label: "リラックス" },
  CREATIVE: { icon: "🎨", color: "from-cyan-400 to-teal-500", label: "クリエイティブ" },
  MUSIC: { icon: "🎵", color: "from-pink-400 to-rose-500", label: "音楽" },
}

interface Store {
  activities: Activity[]
  currentUserId: string
  currentUserName: string
  currentUserAvatar: string
  currentUserAvatarOuterColor: string
  currentUserAvatarInnerColor: string
  likedActivityIds: string[]
}

// 初期サンプルアクティビティ
const initialActivities: Activity[] = [
  {
    id: "1",
    text: "散歩に出かける",
    category: "MOVE",
    userId: "user1",
    userName: "田中太郎",
    userAvatar: "/default-user-avatar.png",
    userAvatarOuterColor: "from-blue-400 to-cyan-500",
    userAvatarInnerColor: "from-purple-400 to-pink-500",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    likes: 12,
    likedBy: ["user2", "user3"],
  },
  {
    id: "2",
    text: "瞑想する",
    category: "RELAX",
    userId: "user2",
    userName: "佐藤花子",
    userAvatar: "/default-user-avatar.png",
    userAvatarOuterColor: "from-pink-400 to-rose-500",
    userAvatarInnerColor: "from-yellow-400 to-orange-500",
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    likes: 8,
    likedBy: ["user1"],
  },
  {
    id: "3",
    text: "絵を描く",
    category: "CREATIVE",
    userId: "user3",
    userName: "鈴木一郎",
    userAvatar: "/default-user-avatar.png",
    userAvatarOuterColor: "from-green-400 to-emerald-500",
    userAvatarInnerColor: "from-cyan-400 to-teal-500",
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
    likes: 15,
    likedBy: ["user1", "user2", "user4"],
  },
  {
    id: "4",
    text: "新しい音楽を聴く",
    category: "MUSIC",
    userId: "user4",
    userName: "高橋美咲",
    userAvatar: "/default-user-avatar.png",
    userAvatarOuterColor: "from-purple-400 to-pink-500",
    userAvatarInnerColor: "from-orange-400 to-red-500",
    createdAt: new Date(Date.now() - 1000 * 60 * 180),
    likes: 6,
    likedBy: [],
  },
  {
    id: "5",
    text: "ストレッチをする",
    category: "MOVE",
    userId: "user1",
    userName: "田中太郎",
    userAvatar: "/default-user-avatar.png",
    userAvatarOuterColor: "from-blue-400 to-cyan-500",
    userAvatarInnerColor: "from-purple-400 to-pink-500",
    createdAt: new Date(Date.now() - 1000 * 60 * 240),
    likes: 10,
    likedBy: ["user2"],
  },
]

let store: Store = {
  activities: initialActivities,
  currentUserId: "me",
  currentUserName: "あなた",
  currentUserAvatar: "/default-user-avatar.png",
  currentUserAvatarOuterColor: "from-blue-400 to-cyan-500",
  currentUserAvatarInnerColor: "from-purple-400 to-pink-500",
  likedActivityIds: [],
}

const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return store
}

export function addActivity(text: string, category: GenreType) {
  const newActivity: Activity = {
    id: Date.now().toString(),
    text,
    category,
    userId: store.currentUserId,
    userName: store.currentUserName,
    userAvatar: store.currentUserAvatar,
    createdAt: new Date(),
    likes: 0,
    likedBy: [],
  }
  store = {
    ...store,
    activities: [newActivity, ...store.activities],
  }
  emitChange()
}

export function toggleLike(activityId: string) {
  const activity = store.activities.find((a) => a.id === activityId)
  if (!activity) return

  const isLiked = store.likedActivityIds.includes(activityId)

  store = {
    ...store,
    likedActivityIds: isLiked
      ? store.likedActivityIds.filter((id) => id !== activityId)
      : [...store.likedActivityIds, activityId],
    activities: store.activities.map((a) =>
      a.id === activityId
        ? {
          ...a,
          likes: isLiked ? a.likes - 1 : a.likes + 1,
          likedBy: isLiked
            ? a.likedBy.filter((id) => id !== store.currentUserId)
            : [...a.likedBy, store.currentUserId],
        }
        : a,
    ),
  }
  emitChange()
}

export function updateUserName(newName: string) {
  store = {
    ...store,
    currentUserName: newName,
    activities: store.activities.map((a) => (a.userId === store.currentUserId ? { ...a, userName: newName } : a)),
  }
  emitChange()
}

export function getCurrentRank(activityCount: number): Rank {
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (activityCount >= ranks[i].minCount) {
      return ranks[i]
    }
  }
  return ranks[0]
}

export function getNextRankInfo(activityCount: number): { nextRank: Rank | null; remaining: number } {
  const currentRank = getCurrentRank(activityCount)
  const currentIndex = ranks.findIndex((r) => r.name === currentRank.name)

  if (currentIndex === ranks.length - 1) {
    return { nextRank: null, remaining: 0 }
  }

  const nextRank = ranks[currentIndex + 1]
  return { nextRank, remaining: nextRank.minCount - activityCount }
}

export function getMostFrequentCategory(activities: Activity[]): GenreType | null {
  const userActivities = activities.filter((a) => a.userId === store.currentUserId)
  if (userActivities.length === 0) return null

  const categoryCount: Record<GenreType, number> = {
    RELAX: 0,
    MOVE: 0,
    CREATIVE: 0,
    MUSIC: 0,
  }
  userActivities.forEach((a) => {
    categoryCount[a.category]++
  })

  let maxCategory: GenreType = "RELAX"
  let maxCount = 0
  Object.entries(categoryCount).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count
      maxCategory = category as GenreType
    }
  })

  return maxCount > 0 ? maxCategory : null
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function getRandomActivity(): { text: string; category: GenreType } {
  // current genre scores を localStorage から読み込む
  let genreScores = loadGenreScores("genreScores")

  // 存在しない場合は初期化して保存
  if (genreScores === null) {
    const initialized = initializeGenreScores()
    saveGenreScores("genreScores", initialized)
    genreScores = initialized
  }

  // 確率分布に基づきジャンルを選択
  const selected = selectGenre(genreScores!)

  // 選択されたジャンルで bandit を実行して更新（genreBandit は内部で保存する）
  const updated = genreBandit(selected.key)

  // 念のため最新のスコアを保存
  saveGenreScores("genreScores", updated)

  // 選択されたジャンルに一致するアクティビティをランダムに返す
  const candidates = activitySuggestions.filter((a) => a.category === selected.key)
  if (candidates.length === 0) {
    const fallback = activitySuggestions[Math.floor(Math.random() * activitySuggestions.length)]
    return { text: fallback.text, category: fallback.category }
  }
  const activity = candidates[Math.floor(Math.random() * candidates.length)]
  return { text: activity.text, category: activity.category }
}

export function updateUserAvatarColors(outerColor: string, innerColor: string) {
  store = {
    ...store,
    currentUserAvatarOuterColor: outerColor,
    currentUserAvatarInnerColor: innerColor,
    activities: store.activities.map((a) =>
      a.userId === store.currentUserId
        ? { ...a, userAvatarOuterColor: outerColor, userAvatarInnerColor: innerColor }
        : a,
    ),
  }
  emitChange()
}

export function getUserAvatarColors(userId: string): { outer: string; inner: string } {
  if (userId === store.currentUserId) {
    return {
      outer: store.currentUserAvatarOuterColor,
      inner: store.currentUserAvatarInnerColor,
    }
  }
  // Find from activities
  const activity = store.activities.find((a) => a.userId === userId)
  if (activity) {
    return {
      outer: activity.userAvatarOuterColor || "from-gray-400 to-gray-500",
      inner: activity.userAvatarInnerColor || "from-gray-400 to-gray-500",
    }
  }
  return { outer: "from-gray-400 to-gray-500", inner: "from-gray-400 to-gray-500" }
}

export const avatarColorOptions = [
  { label: "ブルー", outer: "from-blue-400 to-cyan-500", inner: "from-purple-400 to-pink-500" },
  { label: "ピンク", outer: "from-pink-400 to-rose-500", inner: "from-yellow-400 to-orange-500" },
  { label: "グリーン", outer: "from-green-400 to-emerald-500", inner: "from-cyan-400 to-teal-500" },
  { label: "パープル", outer: "from-purple-400 to-pink-500", inner: "from-orange-400 to-red-500" },
  { label: "オレンジ", outer: "from-orange-400 to-red-500", inner: "from-green-400 to-emerald-500" },
  { label: "シアン", outer: "from-cyan-400 to-teal-500", inner: "from-pink-400 to-rose-500" },
]
