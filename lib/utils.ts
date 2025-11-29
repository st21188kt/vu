import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// 時間帯ラベルを取得するヘルパー関数
export const getCurrentTimeLabel = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return "朝";
    if (hour >= 10 && hour < 17) return "日中";
    if (hour >= 17 && hour < 22) return "夕方・夜";
    return "深夜";
};