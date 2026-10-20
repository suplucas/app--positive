import { useCallback, useEffect, useState } from "react";
import { getRestaurant, getRestaurantReviews } from "./api/restaurant";
import type { RestaurantProfile } from "./api/types";
import type { Review } from "./types";

export type RestaurantStatus = "loading" | "idle" | "error";

export function useRestaurant(cnpj: string, userId?: string, enabled = true) {
  const [data, setData] = useState<RestaurantProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<RestaurantStatus>(
    enabled ? "loading" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setStatus("loading");
    setError(null);
    try {
      const [profile, page] = await Promise.all([
        getRestaurant(cnpj, userId),
        getRestaurantReviews(cnpj),
      ]);
      setData(profile);
      setReviews(page.results);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [cnpj, userId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }
    void load();
  }, [enabled, load]);

  return {
    data,
    reviews,
    status,
    error,
    refresh: load,
  };
}
