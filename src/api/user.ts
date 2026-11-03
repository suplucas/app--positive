import { apiFetch } from "./client";
import type { Review, UserProfile } from "./types";

export type SavedRestaurant = {
  id: string;
  nome: string;
  bairro: string | null;
  nota: number | null;
};

export async function getUser(id: string, viewerId?: string, baseUrl?: string) {
  return apiFetch<UserProfile>(`/users/${encodeURIComponent(id)}`, {
    userId: viewerId,
    baseUrl,
  });
}

// Edita o próprio perfil (nome/bio/foto). Só os campos presentes mudam;
// `bio: null` limpa a bio e `photoUrl: null` remove a foto.
export type UserProfileEdit = {
  name?: string;
  bio?: string | null;
  username?: string | null;
  photoUrl?: string | null;
};

export async function updateUserProfile(
  id: string,
  data: UserProfileEdit,
  baseUrl?: string,
): Promise<UserProfile> {
  const profile = await apiFetch<UserProfile>(
    `/users/${encodeURIComponent(id)}`,
    { method: "PUT", userId: id, baseUrl, body: data },
  );
  if (typeof profile !== "object" || profile === null || !profile.id) {
    throw new Error("PUT /users/:id: invalid payload");
  }
  return profile;
}

export async function getUserReviews(
  id: string,
  page = 1,
  limit = 20,
  viewerId?: string,
  baseUrl?: string,
) {
  return apiFetch<{
    page: number;
    limit: number;
    total: number;
    results: Review[];
  }>(`/users/${encodeURIComponent(id)}/reviews?page=${page}&limit=${limit}`, {
    userId: viewerId,
    baseUrl,
  });
}

export async function getSaves(
  userId: string,
  baseUrl?: string,
): Promise<SavedRestaurant[]> {
  return apiFetch<SavedRestaurant[]>(
    `/users/${encodeURIComponent(userId)}/saves`,
    { userId, baseUrl },
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
