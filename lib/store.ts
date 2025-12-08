"use client"

import { useSyncExternalStore } from "react"
import type { GenreType } from "@/types/genre"

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
  textColor: string
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  avatarOuterColor: string
  avatarInnerColor: string
}

export const ranks: Rank[] = [
  { name: "ビギナー", minCount: 0, color: "from-gray-500 to-gray-700", textColor: "text-gray-600" },
  { name: "チャレンジャー", minCount: 5, color: "from-green-400 to-emerald-500", textColor: "text-green-500" },
  { name: "アクティブ", minCount: 15, color: "from-blue-400 to-cyan-500", textColor: "text-cyan-500" },
  { name: "エキスパート", minCount: 30, color: "from-purple-400 to-pink-500", textColor: "text-pink-500" },
  { name: "マスター", minCount: 50, color: "from-yellow-400 to-orange-500", textColor: "text-orange-500" },
  { name: "レジェンド", minCount: 100, color: "from-rose-400 to-red-500", textColor: "text-red-500" },
]



export const categoryIcons: Record<GenreType, { icon: string; color: string; label: string }> = {
  MOVE: { icon: "🏃", color: "from-green-400 to-emerald-500", label: "MOVE" },
  RELAX: { icon: "🧘", color: "from-purple-400 to-violet-500", label: "RELAX" },
  CREATIVE: { icon: "🎨", color: "from-cyan-400 to-teal-500", label: "CREATIVE" },
  MUSIC: { icon: "🎵", color: "from-pink-400 to-rose-500", label: "MUSIC" },
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

let store: Store = {
  activities: [],
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
  { label: "ブルー", outer: "from-blue-400 to-cyan-500", inner: "from-blue-400 to-cyan-500" },
  { label: "ピンク", outer: "from-pink-400 to-rose-500", inner: "from-pink-400 to-rose-500" },
  { label: "グリーン", outer: "from-green-400 to-emerald-500", inner: "from-green-400 to-emerald-500" },
  { label: "パープル", outer: "from-purple-400 to-pink-500", inner: "from-purple-400 to-pink-500" },
  { label: "オレンジ", outer: "from-orange-400 to-red-500", inner: "from-orange-400 to-red-500" },
  { label: "シアン", outer: "from-cyan-400 to-teal-500", inner: "from-cyan-400 to-teal-500" },
]
