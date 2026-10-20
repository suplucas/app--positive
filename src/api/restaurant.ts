import { apiFetch } from "./client";
import type { RestaurantProfile, Review } from "./types";

export type RestaurantReviewsPage = {
  page: number;
  limit: number;
  total: number;
  results: Review[];
};

export async function getRestaurant(
  cnpj: string,
  userId?: string,
  baseUrl?: string,
): Promise<RestaurantProfile> {
  return apiFetch<RestaurantProfile>(
    `/restaurants/${encodeURIComponent(cnpj)}`,
    { userId, baseUrl },
  );
}

export async function getRestaurantReviews(
  cnpj: string,
  page = 1,
  limit = 20,
  baseUrl?: string,
): Promise<RestaurantReviewsPage> {
  return apiFetch<RestaurantReviewsPage>(
    `/restaurants/${encodeURIComponent(cnpj)}/reviews?page=${page}&limit=${limit}`,
    { baseUrl },
  );
}
