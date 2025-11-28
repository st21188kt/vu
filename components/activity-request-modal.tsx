"use client"

import { useState, useCallback } from "react"
import { X, RefreshCw, Check, Sparkles } from "lucide-react"
import { getRandomActivity, addActivity, categoryIcons } from "@/lib/store"
import type { GenreType } from "@/types/genre"
import { cn } from "@/lib/utils"

interface ActivityRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ActivityRequestModal({ isOpen, onClose }: ActivityRequestModalProps) {
  const [currentActivity, setCurrentActivity] = useState<{ text: string; category: GenreType }>(getRandomActivity())
  const [isSpinning, setIsSpinning] = useState(false)

  const handleRetry = useCallback(() => {
    setIsSpinning(true)
    setTimeout(() => {
      setCurrentActivity(getRandomActivity())
      setIsSpinning(false)
    }, 400)
  }, [])

  const handleComplete = useCallback(() => {
    addActivity(currentActivity.text, currentActivity.category)
    onClose()
    setCurrentActivity(getRandomActivity())
  }, [currentActivity, onClose])

  if (!isOpen) return null

  const categoryInfo = categoryIcons[currentActivity.category]

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-xl" onClick={onClose} aria-hidden="true" />

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
                    <h2 id="modal-title" className="text-xl font-bold">
                      アクティビティ提案
                    </h2>
                    <p className="text-sm text-muted-foreground">新しい体験を見つけよう</p>
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
                        categoryInfo?.color || "from-gray-400 to-gray-500",
                      )}
                    >
                      {categoryInfo?.icon || "✨"}
                    </div>
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-secondary text-muted-foreground mb-3">
                      {currentActivity.category}
                    </span>
                    <p className="text-xl font-semibold text-foreground leading-relaxed">{currentActivity.text}</p>
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
                  <RefreshCw className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
                  再試行
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl gradient-instagram text-white font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all duration-200"
                >
                  <Check className="w-5 h-5" />
                  実行した
                </button>
              </div>

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
  )
}
