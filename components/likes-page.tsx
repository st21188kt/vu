"use client";

import { useState, useEffect } from "react";
import { ActivityCard } from "./activity-card";
import { Heart } from "lucide-react";
import { fetchUserActivities, addLike, removeLike } from "@/lib/api";
import { useUser } from "@/contexts/user-context";
import type { Activity } from "@/lib/api";

export function LikesPage() {
    const { userId } = useUser();
    const [likedActivities, setLikedActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // ユーザーの投稿を取得
            const userActivities = await fetchUserActivities(userId);
            // いいねされた投稿だけをフィルタ
            const activities = userActivities.filter(
                (a) => a.likedBy.length > 0
            );
            setLikedActivities(activities);
        } catch (error) {
            console.error("Failed to load liked activities:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // アクティビティ作成またはいいね変更イベントをリスン
        const handleActivityCreated = () => {
            console.log(
                "Activity created or liked in likes page, reloading..."
            );
            loadData();
        };

        window.addEventListener("activityCreated", handleActivityCreated);
        return () =>
            window.removeEventListener(
                "activityCreated",
                handleActivityCreated
            );
    }, [userId]);

    const handleToggleLike = async (activityId: string) => {
        if (!userId) return;
        const activity = likedActivities.find((a) => a.id === activityId);
        if (!activity) return;

        try {
            const isLiked = activity.likedBy.includes(userId);
            if (isLiked) {
                await removeLike(userId, activityId);
            } else {
                await addLike(userId, activityId);
            }
            // 即座にデータを再取得
            await loadData();
            // いいね変更イベントを発火
            window.dispatchEvent(new Event("activityCreated"));
        } catch (error) {
            console.error("Failed to toggle like:", error);
        }
    };

if (isLoading) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 bounce-together">
                <Heart className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">読み込み中...</p>
        </div>
    );
}


    return (
        <div className="flex-1 flex flex-col">
            <div className="sticky top-16 z-40 glass border-b border-border/50">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <h1 className="text-lg font-bold flex items-center gap-2">
                        <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
                        いいねされた投稿
                        {likedActivities.length > 0 && (
                            <span className="text-sm font-normal text-muted-foreground">
                                ({likedActivities.length})
                            </span>
                        )}
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {likedActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
                            <Heart className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                        <p className="text-lg font-medium">
                            いいねされた投稿はありません
                        </p>
                        <p className="text-sm mt-2 text-center px-8">
                            あなたの投稿がいいねされると表示されます
                        </p>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto">
                        {likedActivities.map((activity, index) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                isLiked={activity.likedBy.includes(
                                    userId || ""
                                )}
                                onToggleLike={() =>
                                    handleToggleLike(activity.id)
                                }
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
