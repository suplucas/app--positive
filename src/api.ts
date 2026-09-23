import type { FeedResponse } from "./types.js";

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
