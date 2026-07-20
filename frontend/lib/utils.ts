import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CURRENCIES } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  const symbol = CURRENCIES[currency] || "₹";
  return `${symbol}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("default", { month: "long" });
}

export function getDaysRemaining(targetDate: string): number {
  const today = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getProgressColor(progress: number): string {
  if (progress >= 100) return "bg-emerald-500 text-white";
  if (progress >= 60) return "bg-blue-500 text-white";
  if (progress >= 30) return "bg-amber-500 text-white";
  return "bg-rose-500 text-white";
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "positive": return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "warning": return "text-amber-600 bg-amber-50 border-amber-200";
    default: return "text-blue-600 bg-blue-50 border-blue-200";
  }
}

export const CHART_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

export function toDateInputValue(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

export function todayDateStr(): string {
  return new Date().toISOString().split("T")[0];
}

