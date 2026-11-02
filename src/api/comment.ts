import { apiFetch } from "./client";
import type { ReviewComment } from "./types";

export async function getComments(
  reviewId: string | number,
  page = 1,
  limit = 50,
  baseUrl?: string,
) {
  return apiFetch<{
    page: number;
    limit: number;
    total: number;
    results: ReviewComment[];
  }>(
    `/reviews/${encodeURIComponent(String(reviewId))}/comments?page=${page}&limit=${limit}`,
    { baseUrl },
  );
}

export async function addComment(
  reviewId: string | number,
  userId: string,
  text: string,
  baseUrl?: string,
) {
  return apiFetch<ReviewComment>(
    `/reviews/${encodeURIComponent(String(reviewId))}/comments`,
    { method: "POST", userId, baseUrl, body: { text } },
  );
}

export async function getNotifications(
  userId: string,
  page = 1,
  limit = 20,
  baseUrl?: string,
) {
  return apiFetch<{
    page: number;
    limit: number;
    total: number;
    results: import("./types").AppNotification[];
  }>(`/notifications?page=${page}&limit=${limit}`, { userId, baseUrl });
}

export async function markNotificationRead(
  userId: string,
  id: string | number,
  baseUrl?: string,
) {
  return apiFetch<{ read: boolean }>(
    `/notifications/${encodeURIComponent(String(id))}/read`,
    { method: "POST", userId, baseUrl },
  );
}
