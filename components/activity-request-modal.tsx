"use client";

import { useState, useCallback, useEffect } from "react";
import { X, RefreshCw, Check, Sparkles } from "lucide-react";
import { categoryIcons, createActivity } from "@/lib/api";
import { useUser } from "@/contexts/user-context";
import { genreBandit, initializeGenreScores } from "@/utils/genreBandit";
import { selectGenre } from "@/utils/selection";
import {
    loadGenreScores,
    saveGenreScores,
    saveSuggestionHistory,
    loadSuggestionHistory,
} from "@/utils/storage";
import type { GenreType, GenreScore } from "@/types/genre";
import { cn } from "@/lib/utils";

interface ActivityRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

async function getSuggestionFromAI(
    genre: GenreType,
    userId: string
): Promise<string> {
    // ユーザーの提案履歴を取得
    const history = loadSuggestionHistory(userId) || [];

    try {
        const response = await fetch("/api/suggestion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                genre: genre,
                last10Activities: history,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `API request failed with status ${response.status}`
            );
        }

        const data = await response.json();
        const suggestion = data.suggestion || "";

        // 提案をユーザーごとに保存
        if (suggestion) {
            saveSuggestionHistory(userId, suggestion);
        }

        return suggestion;
    } catch (error) {
        console.error("Failed to get suggestion from AI:", error);
        throw error;
    }
}

async function getNextActivity(
    userId: string
): Promise<{ text: string; category: GenreType } | null> {
    try {
        // localStorageからgenreScoresを読み込む
        let genreScores = loadGenreScores("genreScores");

        // 存在しない場合は初期化
        if (genreScores === null) {
            genreScores = initializeGenreScores();
            saveGenreScores("genreScores", genreScores);
        }

        // selectGenre関数でジャンルを選択（学習なし、単なる選択）
        const selectedGenreScore = selectGenre(genreScores);
        const selectedGenre = selectedGenreScore.key;

        // AIに提案を依頼
        const suggestion = await getSuggestionFromAI(selectedGenre, userId);

        if (!suggestion) {
            return null;
        }

        return {
            text: suggestion,
            category: selectedGenre,
        };
    } catch (error) {
        console.error("Failed to get next activity:", error);
        return null;
    }
}

export function ActivityRequestModal({
    isOpen,
    onClose,
}: ActivityRequestModalProps) {
    const { userId } = useUser();
    const [currentActivity, setCurrentActivity] = useState<{
        text: string;
        category: GenreType;
    } | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    // モーダルが開かれたときに初期提案を取得
    useEffect(() => {
        if (isOpen && userId && !currentActivity) {
            const initializeSuggestion = async () => {
                setIsInitializing(true);
                try {
                    console.log(
                        "ActivityRequestModal: initializing suggestion for userId:",
                        userId
                    );
                    const activity = await getNextActivity(userId);
                    console.log(
                        "ActivityRequestModal: got activity:",
                        activity
                    );
                    if (activity) {
                        setCurrentActivity(activity);
                    } else {
                        setError("提案の取得に失敗しました");
                    }
                } catch (err) {
                    setError("提案の取得に失敗しました");
                    console.error(
                        "ActivityRequestModal: initialization error:",
                        err
                    );
                } finally {
                    setIsInitializing(false);
                }
            };

            initializeSuggestion();
        }
    }, [isOpen, userId]);

    const handleRetry = useCallback(async () => {
        if (!userId) {
            setError("ユーザーIDが見つかりません");
            return;
        }

        setIsSpinning(true);
        setError(null);
        try {
            const activity = await getNextActivity(userId);
            if (activity) {
                setCurrentActivity(activity);
            } else {
                setError("提案の取得に失敗しました");
            }
        } catch (err) {
            setError("提案の取得に失敗しました");
            console.error(err);
        } finally {
            setIsSpinning(false);
        }
    }, [userId]);

    const handleComplete = useCallback(async () => {
        if (!userId) {
            setError("ユーザーIDが見つかりません");
            return;
        }

        if (!currentActivity) {
            setError("提案が選択されていません");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            console.log(
                "ActivityRequestModal: creating activity with userId:",
                userId
            );
            const result = await createActivity(
                userId,
                currentActivity.text,
                currentActivity.category
            );
            console.log("ActivityRequestModal: createActivity result:", result);
            if (!result) {
                setError("アクティビティの作成に失敗しました");
                return;
            }

            // アクティビティ完了時に報酬フィードバックを実行
            // genreBanditを再度実行することで、選択されたジャンルのスコアを上昇させる
            console.log(
                "ActivityRequestModal: applying reward feedback for genre:",
                currentActivity.category
            );
            genreBandit(currentActivity.category);

            // アクティビティ作成イベントを発火
            console.log(
                "ActivityRequestModal: dispatching activityCreated event"
            );
            window.dispatchEvent(new Event("activityCreated"));
            onClose();
            setCurrentActivity(null);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "エラーが発生しました";
            console.error("Failed to create activity:", error);
            setError(`エラー: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [currentActivity, onClose, userId]);

    if (!isOpen) return null;

    if (isInitializing || !currentActivity) {
        return (
            <>
                <div
                    className="fixed inset-0 z-50 bg-background/60 backdrop-blur-xl"
                    onClick={onClose}
                    aria-hidden="true"
                />

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                    >
                        <div className="gradient-instagram rounded-3xl p-0.5 shadow-2xl shadow-pink-500/20">
                            <div className="bg-card rounded-3xl overflow-hidden">
                                <div className="px-6 py-16 text-center">
                                    <div className="w-12 h-12 gradient-instagram rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 mx-auto mb-4">
                                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                    </div>
                                    <p className="text-muted-foreground">
                                        AIが提案を準備中...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const categoryInfo = categoryIcons[currentActivity.category];

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-background/60 backdrop-blur-xl"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                key={currentActivity?.text}
                    className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div className="gradient-instagram rounded-3xl p-0.5 shadow-2xl shadow-pink-500/20">
                        <div className="bg-card rounded-3xl overflow-hidden">
                            {/* ヘッダー */}
                            <div className="relative px-6 pt-6 pb-4">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
                                    aria-label="閉じる"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 gradient-instagram rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2
                                            id="modal-title"
                                            className="text-xl font-bold"
                                        >
                                            アクティビティ提案
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            AI が提案を作成しました
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* コンテンツ */}
                            <div className="px-6 pb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 gradient-instagram opacity-10 rounded-2xl blur-xl" />
                                    <div className="relative bg-secondary/50 rounded-2xl p-8 text-center border border-border/50">
                                        <div
                                            className={cn(
                                                "w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br flex items-center justify-center text-3xl shadow-lg",
                                                categoryInfo?.color ||
                                                    "from-gray-400 to-gray-500"
                                            )}
                                        >
                                            {categoryInfo?.icon || "✨"}
                                        </div>
                                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-secondary text-muted-foreground mb-3">
                                            {currentActivity.category}
                                        </span>
                                        <p className="text-xl font-semibold text-foreground leading-relaxed">
                                            {currentActivity.text}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* アクションボタン */}
                            <div className="px-6 pb-6 flex gap-3">
                                <button
                                    onClick={handleRetry}
                                    disabled={isSpinning}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-border font-semibold text-foreground hover:bg-secondary transition-all duration-200 disabled:opacity-50"
                                >
                                    <RefreshCw
                                        className={`w-5 h-5 ${
                                            isSpinning ? "animate-spin" : ""
                                        }`}
                                    />
                                    再試行
                                </button>
                                <button
                                    onClick={handleComplete}
                                    disabled={isLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl gradient-instagram text-white font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
                                >
                                    <Check className="w-5 h-5" />
                                    {isLoading ? "送信中..." : "実行する"}
                                </button>
                            </div>

                            {error && (
                                <div className="px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-xl mx-6 mb-4">
                                    <p className="text-sm text-red-600 font-medium">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <div className="px-6 pb-6">
                                <p className="text-xs text-center text-muted-foreground">
                                    「実行する」を押すとアクティビティが投稿されます
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
