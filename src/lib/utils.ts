import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes without conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a short, URL-safe public id. */
export function publicId(prefix = ""): string {
  const rnd = Math.random().toString(32).slice(2, 8);
  const ts = Date.now().toString(32).slice(-4);
  return `${prefix}${ts}${rnd}`;
}

/** Format a date for display. */
export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Generate a human-friendly ticket number like ECHO-2026-00042. */
export function ticketNumber(d?: Date): string {
  const date = d ?? new Date();
  const y = date.getFullYear();
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  return `ECHO-${y}-${seq}`;
}
