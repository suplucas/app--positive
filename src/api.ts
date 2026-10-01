import type { FeedResponse, Review } from "./types";

export async function getFeed(
  userId: string,
  page: number,
  limit: number,
  baseUrl: string = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
): Promise<FeedResponse> {
  const url = `${baseUrl}/feed?page=${page}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { "x-user-id": userId, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`GET /feed failed: ${res.status}`);
  }
  const data = (await res.json()) as FeedResponse;
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
  // escala da API 0-5; a UI v2 envia float (nota 0-10 / 2). O Postgres
  // ainda guarda INTEGER — trocar a coluna p/ NUMERIC(2,1) em breve.
  rating: number;
  comment: string | null;
};

export async function postReview(
  userId: string,
  review: NewReview,
  baseUrl: string = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
): Promise<Review> {
  const res = await fetch(`${baseUrl}/reviews`, {
    method: "POST",
    headers: {
      "x-user-id": userId,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    throw new Error(`POST /reviews failed: ${res.status}`);
  }
  const data = (await res.json()) as Review;
  if (typeof data !== "object" || data === null || data.id === undefined) {
    throw new Error("POST /reviews: invalid payload");
  }
  return data;
}
