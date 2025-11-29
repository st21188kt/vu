"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X, Trophy, Flame, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
    getCurrentRank,
    getNextRankInfo,
    categoryIcons,
    avatarColorOptions,
    fetchAllActivities,
    fetchUserActivities,
    fetchUserProfile,
    updateUserProfile,
} from "@/lib/api";
import { useUser } from "@/contexts/user-context";
import { loadGenreScores } from "@/utils/storage";
import { selectGenre } from "@/utils/selection";
import type { Activity, DbUser } from "@/lib/api";

export function AccountPage() {
    const { userId, isLoading: userContextLoading } = useUser();
    const [userProfile, setUserProfile] = useState<DbUser | null>(null);
    const [myActivities, setMyActivities] = useState<Activity[]>([]);
    const [likedActivities, setLikedActivities] = useState<Activity[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showColorSettings, setShowColorSettings] = useState(false);
    const [selectedOuterColor, setSelectedOuterColor] = useState<number | null>(
        null
    );
    const [selectedInnerColor, setSelectedInnerColor] = useState<number | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);

    // ユーザープロフィールとアクティビティを取得
    useEffect(() => {
        const loadData = async () => {
            console.log(
                "AccountPage: loadData called, userId:",
                userId,
                "userContextLoading:",
                userContextLoading
            );

            if (userContextLoading) {
                console.log(
                    "AccountPage: UserContext still loading, waiting..."
                );
                return;
            }

            if (!userId) {
                console.log("AccountPage: userId is empty, stopping load");
                setIsLoading(false);
                setError("ユーザーIDが見つかりません");
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                // ユーザープロフィール取得
                console.log(
                    "AccountPage: fetching user profile for userId:",
                    userId
                );
                let profile = await fetchUserProfile(userId);
                console.log("AccountPage: profile fetch result:", profile);

                if (!profile) {
                    // プロフィールが見つからない場合、自動作成を試みる
                    console.log(
                        "AccountPage: profile not found, attempting to create..."
                    );

                    // Supabase Auth の ユーザー情報を取得
                    const {
                        data: { user: authUser },
                        error: authError,
                    } = await supabase.auth.getUser();

                    if (authError || !authUser) {
                        console.error(
                            "AccountPage: failed to get auth user:",
                            authError
                        );
                        setError("認証情報が見つかりません");
                        setIsLoading(false);
                        return;
                    }

                    // プロフィール作成
                    const username = authUser.email?.split("@")[0] || "User";
                    const { data: newProfile, error: createError } =
                        await supabase
                            .from("users")
                            .insert({
                                user_id: userId,
                                username: username,
                                avatar_url:
                                    authUser.user_metadata?.avatar_url || null,
                                activity_count: 0,
                                most_frequent_genre: null,
                            })
                            .select()
                            .single();

                    if (createError) {
                        console.error(
                            "AccountPage: failed to create profile:",
                            createError
                        );
                        setError(
                            `プロフィール作成エラー: ${createError.message}`
                        );
                        setIsLoading(false);
                        return;
                    }

                    console.log("AccountPage: profile created:", newProfile);
                    profile = newProfile;
                }

                if (profile) {
                    setUserProfile(profile);
                    setEditName(profile.username);
                } else {
                    console.log(
                        "AccountPage: profile is still null after creation attempt"
                    );
                    setError("ユーザープロフィールを取得できません");
                }

                // 全アクティビティ取得
                console.log("AccountPage: fetching all activities");
                const userActivities = await fetchUserActivities(userId);
                console.log(
                    "AccountPage: user activities fetch result:",
                    userActivities
                );
                setMyActivities(userActivities);

                // ユーザーがいいねしたアクティビティを取得
                if (profile) {
                    const allActivities = await fetchAllActivities();
                    const liked = allActivities.filter((a) =>
                        a.likedBy.includes(profile.id)
                    );
                    console.log("AccountPage: liked activities:", liked);
                    setLikedActivities(liked);
                }
            } catch (error) {
                const errorMsg =
                    error instanceof Error
                        ? error.message
                        : "不明なエラーが発生しました";
                console.error("AccountPage: Failed to load user data:", error);
                setError(`読み込みエラー: ${errorMsg}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        // アクティビティ作成イベントをリスン
        const handleActivityCreated = () => {
            console.log("Activity created in account page, reloading...");
            loadData();
        };

        window.addEventListener("activityCreated", handleActivityCreated);
        return () =>
            window.removeEventListener(
                "activityCreated",
                handleActivityCreated
            );
    }, [userId, userContextLoading]);

    // ユーザープロフィールが更新されたときに色を初期化
    useEffect(() => {
        if (userProfile) {
            setSelectedOuterColor(userProfile.outer_color_id ?? 0);
            setSelectedInnerColor(userProfile.inner_color_id ?? 3);
        }
    }, [userProfile]);

    const handleSaveName = async () => {
        if (editName.trim() && userId) {
            await updateUserProfile(userId, { username: editName.trim() });
            setUserProfile((prev) =>
                prev ? { ...prev, username: editName.trim() } : null
            );
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditName(userProfile?.username || "");
        setIsEditing(false);
    };

    const handleSaveColors = async () => {
        if (
            !userId ||
            selectedOuterColor === null ||
            selectedInnerColor === null
        ) {
            return;
        }

        try {
            // Update Supabase using the API function
            const updated = await updateUserProfile(userId, {
                outer_color_id: selectedOuterColor,
                inner_color_id: selectedInnerColor,
            });

            if (!updated) {
                setError("アバター色の更新に失敗しました");
                return;
            }

            // Update local state
            setUserProfile(updated);
            setShowColorSettings(false);
        } catch (err) {
            console.error("Error saving colors:", err);
            setError("アバター色の更新中にエラーが発生しました");
        }
    };

    const handleCancelColors = () => {
        if (userProfile) {
            setSelectedOuterColor(userProfile.outer_color_id ?? 0);
            setSelectedInnerColor(userProfile.inner_color_id ?? 3);
        }
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

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">読み込み中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="text-red-500 text-center">
                    <p className="font-semibold">エラーが発生しました</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">
                    ユーザー情報が見つかりません
                </p>
            </div>
        );
    }

    const activityCount = myActivities.length;
    const currentRank = getCurrentRank(activityCount);
    const { nextRank, remaining } = getNextRankInfo(activityCount);

    // genreScoresをもとに最も実行するジャンルを計算
    const genreScores = loadGenreScores("genreScores");
    const mostFrequentGenre = genreScores ? selectGenre(genreScores) : null;

    return (
        <div className="flex-1 p-4 space-y-6 pb-24">
            {/* プロフィールヘッダー */}
            <div className="card-gradient rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                    {/* アバター */}
                    <div className="relative">
                        <div
                            className={`p-0.5 rounded-full bg-linear-to-tr ${
                                selectedOuterColor !== null
                                    ? avatarColorOptions[selectedOuterColor]
                                          .outer
                                    : "from-blue-400 to-cyan-500"
                            }`}
                        >
                            <div className="p-0.5 bg-card rounded-full">
                                <div
                                    className={`w-20 h-20 rounded-full bg-linear-to-br ${
                                        selectedInnerColor !== null
                                            ? avatarColorOptions[
                                                  selectedInnerColor
                                              ].inner
                                            : "from-purple-400 to-pink-500"
                                    } flex items-center justify-center`}
                                >
                                    <User
                                        className="w-10 h-10 text-white"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* 色設定ボタン */}
                        <button
                            onClick={() =>
                                setShowColorSettings(!showColorSettings)
                            }
                            className="absolute -bottom-2 -right-2 p-2 rounded-full bg-pink-500/80 text-white hover:bg-pink-600 transition-colors shadow-lg"
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
                                    {userProfile.username}
                                </h2>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                        )}
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
            </div>

            {/* 色設定パネル */}
            {showColorSettings && (
                <div className="card-gradient rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        アバター色を選択
                    </h3>

                    {/* 外側の色 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">外側の色</label>
                        <div className="grid grid-cols-2 gap-2">
                            {avatarColorOptions.map((option) => (
                                <button
                                    key={`outer-${option.id}`}
                                    onClick={() =>
                                        setSelectedOuterColor(option.id)
                                    }
                                    className={cn(
                                        "p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                                        `bg-linear-to-br ${option.outer}`,
                                        selectedOuterColor === option.id
                                            ? "border-white shadow-lg"
                                            : "border-transparent opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <span className="text-sm font-medium text-white">
                                        {option.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 内側の色 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">内側の色</label>
                        <div className="grid grid-cols-2 gap-2">
                            {avatarColorOptions.map((option) => (
                                <button
                                    key={`inner-${option.id}`}
                                    onClick={() =>
                                        setSelectedInnerColor(option.id)
                                    }
                                    className={cn(
                                        "p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                                        `bg-linear-to-br ${option.inner}`,
                                        selectedInnerColor === option.id
                                            ? "border-white shadow-lg"
                                            : "border-transparent opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <span className="text-sm font-medium text-white">
                                        {option.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* プレビュー */}
                    <div className="flex justify-center py-2">
                        <div
                            className={`p-0.5 rounded-full bg-linear-to-tr ${
                                selectedOuterColor !== null
                                    ? avatarColorOptions[selectedOuterColor]
                                          .outer
                                    : "from-blue-400 to-cyan-500"
                            }`}
                        >
                            <div className="p-0.5 bg-card rounded-full">
                                <div
                                    className={`w-16 h-16 rounded-full bg-linear-to-br ${
                                        selectedInnerColor !== null
                                            ? avatarColorOptions[
                                                  selectedInnerColor
                                              ].inner
                                            : "from-purple-400 to-pink-500"
                                    } flex items-center justify-center`}
                                >
                                    <User
                                        className="w-8 h-8 text-white"
                                        strokeWidth={1.5}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ボタン */}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleSaveColors}
                            className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            保存
                        </button>
                        <button
                            onClick={handleCancelColors}
                            className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            キャンセル
                        </button>
                    </div>
                </div>
            )}

            {/* メインカード: 一番出やすいジャンル */}
            <div className="card-gradient rounded-2xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    よく実行するジャンル
                </h3>
                {mostFrequentGenre ? (
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                "w-20 h-20 rounded-2xl bg-linear-to-br flex items-center justify-center text-4xl shadow-lg",
                                categoryIcons[mostFrequentGenre.key]?.color ||
                                    "from-gray-400 to-gray-500"
                            )}
                        >
                            {categoryIcons[mostFrequentGenre.key]?.icon || "✨"}
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {categoryIcons[mostFrequentGenre.key]?.label ||
                                    mostFrequentGenre.key}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {
                                    myActivities.filter(
                                        (a) =>
                                            a.category === mostFrequentGenre.key
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
                            `bg-linear-to-r ${currentRank.color} bg-clip-text text-transparent text-3xl font-black`
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
                                    `bg-linear-to-r ${nextRank.color} bg-clip-text text-transparent text-3xl font-black`
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

            {/* いいねしたアクティビティ */}
            <div className="card-gradient rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                        いいねしたアクティビティ
                    </h3>
                </div>
                {likedActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        まだいいねをしていません
                    </p>
                ) : (
                    <div className="space-y-3">
                        {likedActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="p-3 bg-secondary/50 rounded-lg border border-border/50"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-2xl">
                                            {
                                                categoryIcons[activity.category]
                                                    ?.icon
                                            }
                                        </span>
                                        <span className="text-xs font-medium bg-secondary text-muted-foreground px-2 py-1 rounded">
                                            {
                                                categoryIcons[activity.category]
                                                    ?.label
                                            }
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                        <span className="text-xs font-semibold text-red-500">
                                            {activity.likes}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm font-medium mb-2">
                                    {activity.text}
                                </p>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        投稿者: {activity.userName}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {formatDate(activity.createdAt)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
