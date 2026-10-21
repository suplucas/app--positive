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
  const form = new FormData();
  form.append("file", {
    uri,
    name: "review.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const res = await fetch(`${baseUrl ?? apiBaseUrl()}/uploads/review-photo`, {
    method: "POST",
    headers: { "x-user-id": userId, Accept: "application/json" },
    body: form,
  });
  if (!res.ok) {
    throw new ApiError(res.status, "/uploads/review-photo");
  }
  const data = (await res.json()) as { url?: unknown };
  if (typeof data?.url !== "string") {
    throw new Error("POST /uploads/review-photo: invalid payload");
  }
  return data.url;
}
