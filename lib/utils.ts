import { z } from "zod";

// Validation schemas
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters")
  .regex(/^[a-zA-Z\s'-]*$/, "Name can only contain letters, spaces, hyphens, and apostrophes");

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_-]*$/, "Username can only contain letters, numbers, hyphens, and underscores");

export const emailSchema = z.string().email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const bioSchema = z
  .string()
  .max(500, "Bio must be at most 500 characters")
  .optional();

// API Response helpers
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(error: string, code?: string) {
  return {
    success: false,
    error,
    code,
  };
}

// ELO Rating calculation
export function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  playerWon: boolean,
  kFactor: number = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actualScore = playerWon ? 1 : 0;
  const eloChange = kFactor * (actualScore - expectedScore);
  return Math.round(eloChange);
}

// Time formatting
export function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// File validation
export function isValidVideoFile(filename: string, size: number): boolean {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedFormats = ["mp4", "mov", "webm"];
  const ext = filename.split(".").pop()?.toLowerCase();

  return size <= maxSize && ext ? allowedFormats.includes(ext) : false;
}

// Generate unique filename
export function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop();
  return `${timestamp}-${random}.${ext}`;
}
