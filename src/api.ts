import { ApiError, apiBaseUrl, apiFetch } from "./api/client";
import type { FeedResponse, Review } from "./types";

export async function getFeed(
  userId: string,
  page: number,
  limit: number,
  baseUrl?: string,
): Promise<FeedResponse> {
  const data = await apiFetch<FeedResponse>(
    `/feed?page=${page}&limit=${limit}`,
    { userId, baseUrl },
  );
  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray(data.results)
  ) {
    throw new Error("GET /feed: invalid payload");
  }
  return data;
}

export type NewReview = {
  restaurantId: string;
  // escala da API 0-5; a UI v2 envia float (nota 0-10 / 2).
  rating: number;
  comment: string | null;
  photoUrl?: string | null;
  flairs?: string[];
};

export async function postReview(
  userId: string,
  review: NewReview,
  baseUrl?: string,
): Promise<Review> {
  const data = await apiFetch<Review>("/reviews", {
    method: "POST",
    userId,
    baseUrl,
    body: review,
  });
  if (typeof data !== "object" || data === null || data.id === undefined) {
    throw new Error("POST /reviews: invalid payload");
  }
  return data;
}

// Campos editáveis da própria review (docs MVP). Só os campos presentes
// são alterados; `flairs` sempre substitui a lista (vazia limpa todos).
export type ReviewEdit = {
  rating?: number;
  comment?: string | null;
  photoUrl?: string | null;
  flairs?: string[];
};

export async function updateReview(
  userId: string,
  id: string | number,
  review: ReviewEdit,
  baseUrl?: string,
): Promise<Review> {
  const data = await apiFetch<Review>(`/reviews/${id}`, {
    method: "PUT",
    userId,
    baseUrl,
    body: review,
  });
  if (typeof data !== "object" || data === null || data.id === undefined) {
    throw new Error("PUT /reviews/:id: invalid payload");
  }
  return data;
}

export async function deleteReview(
  userId: string,
  id: string | number,
  baseUrl?: string,
): Promise<void> {
  await apiFetch<void>(`/reviews/${id}`, {
    method: "DELETE",
    userId,
    baseUrl,
  });
}

// Incrementa o like da review no backend. O otimismo (+1) fica no hook.
export async function likeReview(
  userId: string,
  id: string | number,
  baseUrl?: string,
): Promise<{ id: number; likes: number }> {
  return apiFetch<{ id: number; likes: number }>(`/reviews/${id}/like`, {
    method: "POST",
    userId,
    baseUrl,
  });
}

// Sobe a foto da review (multipart) e devolve a URL pública salva no
// storage. Chamada antes do POST /reviews; a review guarda só a URL.
export async function uploadReviewPhoto(
  userId: string,
  uri: string,
  baseUrl?: string,
): Promise<string> {
  return uploadPhoto(userId, uri, "/uploads/review-photo", baseUrl);
}

// Sobe a foto de perfil (multipart) e devolve a URL salva no storage.
export async function uploadAvatarPhoto(
  userId: string,
  uri: string,
  baseUrl?: string,
): Promise<string> {
  return uploadPhoto(userId, uri, "/uploads/avatar", baseUrl);
}

async function uploadPhoto(
  userId: string,
  uri: string,
  path: string,
  baseUrl?: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", {
    uri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const res = await fetch(`${baseUrl ?? apiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "x-user-id": userId, Accept: "application/json" },
    body: form,
  });
  if (!res.ok) {
    throw new ApiError(res.status, path);
  }
  const data = (await res.json()) as { url?: unknown };
  if (typeof data?.url !== "string") {
    throw new Error(`POST ${path}: invalid payload`);
  }
  return data.url;
}
