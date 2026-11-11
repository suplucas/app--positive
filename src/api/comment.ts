import { apiFetch } from './client';
import type { ReviewComment } from './types';

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
    { method: 'POST', userId, baseUrl, body: { text } },
  );
}

// Painel v1 (spec 6.5): itens colapsados + enriquecidos, janela de 30d.
// Sem paginação — a API devolve tudo dentro da janela.
export async function getNotifications(userId: string, baseUrl?: string) {
  return apiFetch<import('./types').NotificationsResponse>('/notifications', {
    userId,
    baseUrl,
  });
}

// Marca várias notificações como lidas de uma vez (POST /notifications/read).
export async function markNotificationsRead(
  userId: string,
  ids: (string | number)[],
  baseUrl?: string,
) {
  return apiFetch<{ read: boolean; updated: number }>('/notifications/read', {
    method: 'POST',
    userId,
    baseUrl,
    body: { ids },
  });
}

export async function markNotificationRead(
  userId: string,
  id: string | number,
  baseUrl?: string,
) {
  return apiFetch<{ read: boolean }>(
    `/notifications/${encodeURIComponent(String(id))}/read`,
    { method: 'POST', userId, baseUrl },
  );
}
