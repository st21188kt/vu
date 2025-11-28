"use client";

import { useState } from "react";
import {
    Pencil,
    Check,
    X,
    ChevronRight,
    Trophy,
    Flame,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useStore,
    getCurrentRank,
    getNextRankInfo,
    getMostFrequentCategory,
    updateUserName,
    updateUserAvatarColors,
    avatarColorOptions,
    categoryIcons,
} from "@/lib/store";

export function AccountPage() {
    const store = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(store.currentUserName);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [showColorSettings, setShowColorSettings] = useState(false);
    const [selectedOuterColor, setSelectedOuterColor] = useState(
        store.currentUserAvatarOuterColor
    );
    const [selectedInnerColor, setSelectedInnerColor] = useState(
        store.currentUserAvatarInnerColor
    );

    const myActivities = store.activities.filter(
        (a) => a.userId === store.currentUserId
    );
    const likedActivities = store.activities.filter((a) =>
        store.likedActivityIds.includes(a.id)
    );
    const activityCount = myActivities.length;
    const currentRank = getCurrentRank(activityCount);
    const { nextRank, remaining } = getNextRankInfo(activityCount);
    const mostFrequentCategory = getMostFrequentCategory(store.activities);

    const displayedActivities = showAllHistory
        ? likedActivities
        : likedActivities.slice(0, 3);

    const handleSaveName = () => {
        if (editName.trim()) {
            updateUserName(editName.trim());
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditName(store.currentUserName);
        setIsEditing(false);
    };

    const handleSaveColors = () => {
        updateUserAvatarColors(selectedOuterColor, selectedInnerColor);
        setShowColorSettings(false);
    };

    const handleCancelColors = () => {
        setSelectedOuterColor(store.currentUserAvatarOuterColor);
        setSelectedInnerColor(store.currentUserAvatarInnerColor);
        setShowColorSettings(false);
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) return `${minutes}分前`;
        if (hours < 24) return `${hours}時間前`;
        return `${days}日前`;
    };

    return (
        <div className="flex-1 p-4 space-y-6 pb-24">
            {/* プロフィールヘッダー */}
            <div className="card-gradient rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                    {/* アバター */}
                    <div className="relative">
                        <div
                            className={`p-0.5 rounded-full bg-linear-to-tr ${
                                selectedOuterColor ||
                                store.currentUserAvatarOuterColor
                            }`}
                        >
                            <div className="p-0.5 bg-card rounded-full">
                                <div
                                    className={`w-20 h-20 rounded-full bg-linear-to-br ${
                                        selectedInnerColor ||
                                        store.currentUserAvatarInnerColor
                                    } flex items-center justify-center`}
                                >
                                    <User
                                        className="w-10 h-10 text-white"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() =>
                                setShowColorSettings(!showColorSettings)
                            }
                            className="absolute bottom-0 right-0 p-1.5 rounded-lg bg-secondary/80 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="アバターカラーを変更"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    </div>

                    {/* 名前と称号 */}
                    <div className="flex-1 space-y-1">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveName}
                                    className="p-1.5 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors"
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">
                                    {store.currentUserName}
                                </h2>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {/* 称号/ランク */}
                        <div
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-linear-to-r text-white",
                                currentRank.color
                            )}
                        >
                            <Trophy className="w-4 h-4" />
                            {currentRank.name}
                        </div>
                    </div>
                </div>

                {/* アバターカラー設定 */}
                {showColorSettings && (
                    <div className="border-t border-border/50 pt-4 space-y-4">
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    アバター外側の色
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {avatarColorOptions.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() =>
                                                setSelectedOuterColor(
                                                    option.outer
                                                )
                                            }
                                            className={cn(
                                                "p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                                                selectedOuterColor ===
                                                    option.outer
                                                    ? "border-primary bg-secondary/50"
                                                    : "border-border hover:border-border/70"
                                            )}
                                        >
                                            <div
                                                className={`w-6 h-6 rounded bg-linear-to-br ${option.outer}`}
                                            />
                                            <span className="text-xs font-medium">
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    アバター内側の色
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {avatarColorOptions.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() =>
                                                setSelectedInnerColor(
                                                    option.inner
                                                )
                                            }
                                            className={cn(
                                                "p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                                                selectedInnerColor ===
                                                    option.inner
                                                    ? "border-primary bg-secondary/50"
                                                    : "border-border hover:border-border/70"
                                            )}
                                        >
                                            <div
                                                className={`w-6 h-6 rounded bg-linear-to-br ${option.inner}`}
                                            />
                                            <span className="text-xs font-medium">
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            <button
                                onClick={handleCancelColors}
                                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors text-sm font-medium"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSaveColors}
                                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors text-sm font-medium"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* メインカード: 一番出やすいジャンル */}
            <div className="card-gradient rounded-2xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    よく実行するジャンル
                </h3>
                {mostFrequentCategory ? (
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                "w-20 h-20 rounded-2xl bg-linear-to-br flex items-center justify-center text-4xl shadow-lg",
                                categoryIcons[mostFrequentCategory]?.color ||
                                    "from-gray-400 to-gray-500"
                            )}
                        >
                            {categoryIcons[mostFrequentCategory]?.icon || "✨"}
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {mostFrequentCategory}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {
                                    myActivities.filter(
                                        (a) =>
                                            a.category === mostFrequentCategory
                                    ).length
                                }
                                回実行
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-gray-400 to-gray-500 flex items-center justify-center text-4xl shadow-lg">
                            ✨
                        </div>
                        <div>
                            <p className="text-lg font-medium text-muted-foreground">
                                まだアクティビティがありません
                            </p>
                            <p className="text-sm text-muted-foreground">
                                アクティビティを実行してみましょう
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* サブデータ: 累計回数とランク進捗 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="card-gradient rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-medium">
                            累計実行回数
                        </span>
                    </div>
                    <p
                        className={cn(
                            "text-3xl font-black",
                            currentRank.textColor
                        )}
                    >
                        {activityCount}
                        <span className="text-lg font-medium text-muted-foreground ml-1">
                            回
                        </span>
                    </p>
                </div>
                <div className="card-gradient rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-medium">
                            次のランクまで
                        </span>
                    </div>
                    {nextRank ? (
                        <>
                            <p
                                className={cn(
                                    "text-3xl font-black",
                                    currentRank.textColor
                                )}
                            >
                                {remaining}
                                <span className="text-lg font-medium text-muted-foreground ml-1">
                                    回
                                </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                → {nextRank.name}
                            </p>
                        </>
                    ) : (
                        <p className="text-lg font-bold text-yellow-500">
                            最高ランク達成!
                        </p>
                    )}
                </div>
            </div>

            {/* ランク進捗バー */}
            {nextRank && (
                <div className="card-gradient rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                            {currentRank.name}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                            {nextRank.name}
                        </span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full bg-linear-to-r transition-all duration-500",
                                currentRank.color
                            )}
                            style={{
                                width: `${
                                    ((activityCount - currentRank.minCount) /
                                        (nextRank.minCount -
                                            currentRank.minCount)) *
                                    100
                                }%`,
                            }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        {activityCount} / {nextRank.minCount}
                    </p>
                </div>
            )}

            {/* 最近のアクティビティ履歴 */}
            <div className="card-gradient rounded-2xl p-5">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    いいねした投稿
                </h3>
                {likedActivities.length > 0 ? (
                    <>
                        <div className="space-y-3">
                            {displayedActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-xl bg-linear-to-br flex items-center justify-center text-lg",
                                            categoryIcons[activity.category]
                                                ?.color ||
                                                "from-gray-400 to-gray-500"
                                        )}
                                    >
                                        {categoryIcons[activity.category]
                                            ?.icon || "✨"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {activity.text}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(activity.createdAt)}
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                        {activity.category}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {likedActivities.length > 3 && (
                            <button
                                onClick={() =>
                                    setShowAllHistory(!showAllHistory)
                                }
                                className="w-full mt-4 flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                            >
                                {showAllHistory
                                    ? "閉じる"
                                    : `もっと見る (${
                                          likedActivities.length - 3
                                      }件)`}
                                <ChevronRight
                                    className={cn(
                                        "w-4 h-4 transition-transform",
                                        showAllHistory && "rotate-90"
                                    )}
                                />
                            </button>
                        )}
                    </>
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        いいねした投稿はまだありません
                    </p>
                )}
            </div>
        </div>
    );
}
