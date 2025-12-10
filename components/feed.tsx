"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { InfiniteScrollSentinel } from "@/components/ui/infinite-scroll-sentinel";
import { ActivityCard } from "./activity-card";
import {
    fetchAllActivities,
    addLike,
    removeLike,
    fetchUserProfile,
    fetchActivitiesWithPagination,
} from "@/lib/api";
import { useUser } from "@/contexts/user-context";
import { cn } from "@/lib/utils";
import { Users, User, Sparkles, ChevronDown, Loader2 } from "lucide-react";
import type { Activity } from "@/lib/api";

type FeedTab = "all" | "mine";
const PAGE_SIZE = 10;

export function Feed() {
    const [activeTab, setActiveTab] = useState<FeedTab>("all");
    const [activities, setActivities] = useState<Activity[]>([]);
    const [likedActivityIds, setLikedActivityIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userUUID, setUserUUID] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const { userId } = useUser();

    // ユーザーの UUID を取得
    useEffect(() => {
        const getUserUUID = async () => {
            if (userId) {
                const profile = await fetchUserProfile(userId);
                if (profile) {
                    setUserUUID(profile.id);
                    console.log("Feed: got userUUID:", profile.id);
                }
            }
        };
        getUserUUID();
    }, [userId]);

    // アクティビティを取得
    const loadActivities = async (isInitial = false) => {
        if (isInitial) {
            setIsLoading(true);
            setPage(1);
            setActivities([]); // Clear previous activities
        } else {
            setIsLoadingMore(true);
        }

        const currentPage = isInitial ? 1 : page;
        // mineタブでuserUUIDがない場合はロードしない（useEffectで待機）
        if (activeTab === "mine" && !userUUID) {
            setIsLoading(false);
            return;
        }

        console.log(`Feed: loading activities page ${currentPage} for tab ${activeTab}`);

        const filterUserId = activeTab === "mine" && userUUID ? userUUID : undefined;
        const { activities: newActivities, hasMore: more } =
            await fetchActivitiesWithPagination(currentPage, PAGE_SIZE, filterUserId);

        if (isInitial) {
            setActivities(newActivities);
        } else {
            setActivities((prev) => [...prev, ...newActivities]);
        }
        
        setHasMore(more);
        if (!isInitial) {
            setPage((prev) => prev + 1);
        } else {
             // Initial load sets page to 2 for next load
            setPage(2);
        }

        // 現在のユーザーがいいねしているアクティビティを取得
        if (userUUID) {
            const likedIds = newActivities
                .filter((a) => a.likedBy.includes(userUUID))
                .map((a) => a.id);
            setLikedActivityIds((prev) => {
                if (isInitial) return likedIds;
                // Merge and deduplicate
                return Array.from(new Set([...prev, ...likedIds]));
            });
        }
        
        if (isInitial) setIsLoading(false);
        else setIsLoadingMore(false);
    };

    useEffect(() => {
        // userUUIDがまだ取得できていない場合、mineタブならロードを待機
        if (activeTab === "mine" && !userUUID) return;
        
        loadActivities(true);

        

        // アクティビティ作成イベントをリスン
        const handleActivityCreated = () => {
            console.log("Activity created, reloading feed...");
             // Reload from scratch
            loadActivities(true);
        };

        window.addEventListener("activityCreated", handleActivityCreated);
        return () =>
            window.removeEventListener(
                "activityCreated",
                handleActivityCreated
            );
    }, [userId, userUUID, activeTab]); // activeTab を依存配列に追加

    // フィルタリングはサーバーサイドで行うため、ここはそのまま表示
    const filteredActivities = activities;

    const handleToggleLike = async (activityId: string) => {
        if (!userId) return;

        // Current state
        const wasLiked = likedActivityIds.includes(activityId);

        // Optimistic update
        setLikedActivityIds((prev) =>
            wasLiked ? prev.filter((id) => id !== activityId) : [...prev, activityId]
        );

        setActivities((prev) =>
            prev.map((activity) => {
                if (activity.id === activityId) {
                    return {
                        ...activity,
                        likes: wasLiked ? activity.likes - 1 : activity.likes + 1,
                    };
                }
                return activity;
            })
        );

        try {
            if (wasLiked) {
                await removeLike(userId, activityId);
            } else {
                await addLike(userId, activityId);
            }
            // No reload needed
        } catch (error) {
            console.error("Failed to toggle like:", error);
            // Revert state on error
            setLikedActivityIds((prev) =>
                wasLiked ? [...prev, activityId] : prev.filter((id) => id !== activityId)
            );
            setActivities((prev) =>
                prev.map((activity) => {
                    if (activity.id === activityId) {
                        return {
                            ...activity,
                            likes: wasLiked ? activity.likes + 1 : activity.likes - 1,
                        };
                    }
                    return activity;
                })
            );
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            <div className="sticky top-16 z-40 glass border-b border-border/50">
                <div className="max-w-2xl mx-auto">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={cn(
                                "flex-1 py-4 text-sm font-semibold transition-all duration-300 relative flex items-center justify-center gap-2",
                                activeTab === "all"
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Users className="w-4 h-4" />
                            みんな
                            {activeTab === "all" && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-0.5 gradient-instagram rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("mine")}
                            className={cn(
                                "flex-1 py-4 text-sm font-semibold transition-all duration-300 relative flex items-center justify-center gap-2",
                                activeTab === "mine"
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <User className="w-4 h-4" />
                            あなた
                            {activeTab === "mine" && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-0.5 gradient-instagram rounded-full" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

<div className="flex-1 overflow-y-auto">
     {isLoading ? (
         <div className="flex flex-col items-center justify-center py-24 text-muted-foreground"> 
         <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6"> 
            <Sparkles className="w-10 h-10 text-muted-foreground/50 animate-spin" /> 
            </div> 
            <p className="text-lg font-medium"></p> 
            </div>

                ) : filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                            <Sparkles className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-medium">
                            まだアクティビティがありません
                        </p>
                        <p className="text-sm mt-2">
                            アクティビティをリクエストして始めましょう
                        </p>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto">
                        {filteredActivities.map((activity, index) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                isLiked={likedActivityIds.includes(activity.id)}
                                onToggleLike={() =>
                                    handleToggleLike(activity.id)
                                }
                                index={index}
                            />
                        ))}
                        
                        <InfiniteScrollSentinel
                            onInteract={() => loadActivities(false)}
                            hasMore={hasMore}
                            isLoading={isLoadingMore}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

