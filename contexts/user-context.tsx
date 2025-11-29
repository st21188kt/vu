"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { initializeGenreScores } from "@/utils/genreBandit";
import { selectGenre } from "@/utils/selection";
import { loadGenreScores } from "@/utils/storage";

interface UserContextType {
    userId: string | null;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// UUID v4 を生成する関数
function generateUUID(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // フォールバック: Node.js 環境用
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

// localStorage から ユーザーID を取得または作成
function getOrCreateUserId(): string {
    if (typeof window === "undefined") return "";

    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
        console.log("getOrCreateUserId: existing userId found:", storedUserId);
        return storedUserId;
    }

    const newUserId = generateUUID();
    localStorage.setItem("userId", newUserId);
    console.log("getOrCreateUserId: new userId created:", newUserId);
    return newUserId;
}

// ユーザープロフィールを自動作成または取得
async function ensureUserProfile(userId: string) {
    if (!userId) {
        console.error("ensureUserProfile: userId is empty");
        return;
    }

    try {
        console.log(
            "ensureUserProfile: checking for existing profile, userId:",
            userId
        );

        // ユーザープロフィールが存在するか確認
        const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (existingUser) {
            console.log(
                "ensureUserProfile: existing profile found:",
                existingUser
            );
            return;
        }

        // checkError が PGRST116 (no rows) の場合は新規作成、それ以外はエラー
        if (checkError && checkError.code !== "PGRST116") {
            console.error(
                "ensureUserProfile: error checking for existing user:",
                checkError
            );
            throw checkError;
        }

        // プロフィールが存在しない場合、作成
        console.log(
            "ensureUserProfile: creating new user profile for userId:",
            userId
        );

        // genreScores を初期化してランダムなジャンルを選択
        const genreScores = initializeGenreScores();
        const selectedGenre = selectGenre(genreScores);
        console.log(
            "ensureUserProfile: initialized genre scores, selected genre:",
            selectedGenre
        );

        const newUser = {
            user_id: userId,
            username: `ユーザー${Math.floor(Math.random() * 10000)}`,
            avatar_url: "/default-user-avatar.png",
            outer_color_id: Math.floor(Math.random() * 6), // 0-5
            inner_color_id: Math.floor(Math.random() * 6), // 0-5
            activity_count: 0,
            most_frequent_genre: selectedGenre,
        };

        console.log(
            "ensureUserProfile: attempting to insert user:",
            JSON.stringify(newUser, null, 2)
        );

        const { data: insertedUser, error: insertError } = await supabase
            .from("users")
            .insert([newUser])
            .select()
            .single();

        if (insertError) {
            const errorDetails = {
                message: insertError.message,
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint,
            };
            console.error(
                "❌ ensureUserProfile: failed to insert user profile:",
                JSON.stringify(errorDetails, null, 2)
            );
            console.error(
                "🔐 原因: Supabase の RLS (Row Level Security) ポリシーが INSERT をブロックしています。"
            );
            console.error("⚡ 解決方法（2分で完了）:");
            console.error("1. https://supabase.com/ にアクセス");
            console.error("2. SQL Editor を開く");
            console.error("3. 以下を実行：");
            console.error(
                `
DROP POLICY IF EXISTS "Allow insert" ON users;
DROP POLICY IF EXISTS "Allow select" ON users;
DROP POLICY IF EXISTS "Allow update" ON users;
DROP POLICY IF EXISTS "Allow delete" ON users;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
            `
            );
            console.error("4. ブラウザをリロード");
            console.error("📖 詳細: docs/RLS_SETUP.md を参照");
            throw insertError;
        }

        console.log(
            "ensureUserProfile: new user profile created:",
            insertedUser
        );
    } catch (error) {
        console.error("ensureUserProfile: error:", error);
    }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeUser = async () => {
            // localStorage からユーザーID を取得または作成
            const id = getOrCreateUserId();
            setUserId(id);

            // ユーザープロフィール を自動作成または取得
            await ensureUserProfile(id);
        };

        initializeUser().finally(() => {
            setIsLoading(false);
        });
    }, []);

    const value: UserContextType = {
        userId,
        isLoading,
    };

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within UserProvider");
    }
    console.log("useUser hook called, context:", {
        userId: context.userId,
        isLoading: context.isLoading,
    });
    return context;
}
