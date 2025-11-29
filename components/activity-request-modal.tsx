"use client";

import { useState, useCallback } from "react";
import { X, RefreshCw, Check, Sparkles } from "lucide-react";
import { categoryIcons, createActivity } from "@/lib/api";
import { useUser } from "@/contexts/user-context";
import { genreBandit } from "@/utils/genreBandit";
import { selectGenre } from "@/utils/selection";
import { loadGenreScores } from "@/utils/storage";
import type { GenreType, GenreScore } from "@/types/genre";
import { cn } from "@/lib/utils";

interface ActivityRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function getRandomActivity(): { text: string; category: GenreType } {
    const suggestions: { [key in GenreType]: string[] } = {
        RELAX: [
            "瞑想をする",
            "深呼吸をする",
            "ストレッチをする",
            "好きな音楽を聴く",
            "本を読む",
            "温かいお茶を飲む",
            "窓から外を眺める",
            "アロマテラピーをする",
            "瞑想アプリを使う",
        ],
        MOVE: [
            "散歩に出かける",
            "ジョギングをする",
            "ヨガをする",
            "ダンスをする",
            "筋トレをする",
            "ストレッチをする",
            "縄跳びをする",
            "階段を上り下りする",
            "バドミントンをする",
        ],
        CREATIVE: [
            "絵を描く",
            "音楽を作る",
            "創作を書く",
            "DIYをする",
            "写真を撮る",
            "ブログを書く",
            "デザインを考える",
            "映像編集をする",
            "彫刻をする",
        ],
        MUSIC: [
            "楽器を演奏する",
            "歌を歌う",
            "プレイリストを作る",
            "ラジオを聴く",
            "ポッドキャストを聴く",
            "バンド練習をする",
            "カラオケに行く",
            "ライブに行く",
            "新しい曲を探す",
        ],
    };

    const genreScores = loadGenreScores("genreScores", [
        { key: "RELAX", value: 1 },
        { key: "MOVE", value: 1 },
        { key: "CREATIVE", value: 1 },
        { key: "MUSIC", value: 1 },
    ])!;
    const selectedGenreScore = selectGenre(genreScores);
    const selectedGenre = selectedGenreScore.key;
    genreBandit(selectedGenre);

    const suggestions_list = suggestions[selectedGenre];
    const text =
        suggestions_list[Math.floor(Math.random() * suggestions_list.length)];

    return { text, category: selectedGenre };
}

export function ActivityRequestModal({
    isOpen,
    onClose,
}: ActivityRequestModalProps) {
    const { userId } = useUser();
    const [currentActivity, setCurrentActivity] = useState<{
        text: string;
        category: GenreType;
    }>(getRandomActivity());
    const [isSpinning, setIsSpinning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRetry = useCallback(() => {
        setIsSpinning(true);
        setTimeout(() => {
            setCurrentActivity(getRandomActivity());
            setIsSpinning(false);
        }, 400);
    }, []);

    const handleComplete = useCallback(async () => {
        if (!userId) {
            setError("ユーザーIDが見つかりません");
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
            // アクティビティ作成イベントを発火
            console.log(
                "ActivityRequestModal: dispatching activityCreated event"
            );
            window.dispatchEvent(new Event("activityCreated"));
            onClose();
            setCurrentActivity(getRandomActivity());
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
                    className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div className="gradient-instagram rounded-3xl p-[2px] shadow-2xl shadow-pink-500/20">
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
                                            新しい体験を見つけよう
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
                                                "w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg",
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
                                    {isLoading ? "送信中..." : "実行した"}
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
                                    「実行した」を押すとあなたのフィードに投稿されます
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
