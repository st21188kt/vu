"use client"

import { Home, Heart, Sparkles, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationProps {
  activeTab: "home" | "likes" | "account"
  onTabChange: (tab: "home" | "likes" | "account") => void
  onRequestActivity: () => void
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onTabChange("home")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-all duration-300 group"
          >
            <div className="relative w-10 h-10 gradient-instagram rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow duration-300">
              <span className="text-white font-black text-lg">V</span>
            </div>
            <span className="text-2xl font-black tracking-tight gradient-instagram-text">VU</span>
          </button>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => onTabChange("home")}
              className={cn(
                "relative p-2.5 rounded-xl transition-all duration-300",
                activeTab === "home"
                  ? "text-foreground bg-secondary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
              aria-label="ホーム"
            >
              <Home className="w-6 h-6" strokeWidth={activeTab === "home" ? 2.5 : 1.5} />
            </button>
            <button
              onClick={() => onTabChange("account")}
              className={cn(
                "relative p-2.5 rounded-xl transition-all duration-300",
                activeTab === "account"
                  ? "text-foreground bg-secondary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
              aria-label="アカウント"
            >
              <User className="w-6 h-6" strokeWidth={activeTab === "account" ? 2.5 : 1.5} />
            </button>
            <button
              onClick={() => onTabChange("likes")}
              className={cn(
                "relative p-2.5 rounded-xl transition-all duration-300",
                activeTab === "likes"
                  ? "text-foreground bg-secondary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
              aria-label="いいね履歴"
            >
              <Heart
                className={cn("w-6 h-6", activeTab === "likes" && "fill-pink-500 text-pink-500")}
                strokeWidth={activeTab === "likes" ? 2.5 : 1.5}
              />
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
