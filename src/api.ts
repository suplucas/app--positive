import { apiFetch } from "./api/client";
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
  restaurantCnpj: string;
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
