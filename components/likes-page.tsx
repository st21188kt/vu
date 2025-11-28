"use client";

import { ActivityCard } from "./activity-card";
import { useStore, toggleLike } from "@/lib/store";
import { Heart } from "lucide-react";

export function LikesPage() {
    const store = useStore();

    const likedActivities = store.activities.filter(
        (a) => a.userId === store.currentUserId && a.likedBy.length > 0
    );

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
                                isLiked={true}
                                onToggleLike={() => toggleLike(activity.id)}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
