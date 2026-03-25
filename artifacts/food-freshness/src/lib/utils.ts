import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFreshnessColor(score: number): string {
  if (score >= 80) return "text-status-fresh";
  if (score >= 60) return "text-status-good";
  if (score >= 30) return "text-status-fair";
  return "text-status-spoiled";
}

export function getFreshnessBgColor(score: number): string {
  if (score >= 80) return "bg-status-fresh";
  if (score >= 60) return "bg-status-good";
  if (score >= 30) return "bg-status-fair";
  return "bg-status-spoiled";
}
