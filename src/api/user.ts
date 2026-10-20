import { apiFetch } from "./client";
import type { Review, UserProfile } from "./types";

export type SavedRestaurant = {
  id: string;
  nome: string;
  bairro: string | null;
  nota: number | null;
};

export async function getUser(id: string, baseUrl?: string) {
  return apiFetch<UserProfile>(`/users/${encodeURIComponent(id)}`, { baseUrl });
}

export async function getUserReviews(
  id: string,
  page = 1,
  limit = 20,
  baseUrl?: string,
) {
  return apiFetch<{
    page: number;
    limit: number;
    total: number;
    results: Review[];
  }>(`/users/${encodeURIComponent(id)}/reviews?page=${page}&limit=${limit}`, {
    baseUrl,
  });
}

export async function getSaves(
  userId: string,
  baseUrl?: string,
): Promise<SavedRestaurant[]> {
  return apiFetch<SavedRestaurant[]>(
    `/users/${encodeURIComponent(userId)}/saves`,
    { baseUrl },
  );
}

export async function addSave(userId: string, cnpj: string, baseUrl?: string) {
  return apiFetch<{ saved: boolean }>(`/saves/${encodeURIComponent(cnpj)}`, {
    method: "POST",
    userId,
    baseUrl,
  });
}

export async function removeSave(
  userId: string,
  cnpj: string,
  baseUrl?: string,
) {
  return apiFetch<{ saved: boolean }>(`/saves/${encodeURIComponent(cnpj)}`, {
    method: "DELETE",
    userId,
    baseUrl,
  });
}

export async function followUser(
  userId: string,
  targetId: string,
  baseUrl?: string,
) {
  return apiFetch<{ following: boolean }>(
    `/users/${encodeURIComponent(targetId)}/follow`,
    { method: "POST", userId, baseUrl },
  );
}

export async function unfollowUser(
  userId: string,
  targetId: string,
  baseUrl?: string,
) {
  return apiFetch<{ following: boolean }>(
    `/users/${encodeURIComponent(targetId)}/follow`,
    { method: "DELETE", userId, baseUrl },
  );
}
