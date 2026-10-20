import { useCallback, useEffect, useState } from "react";
import { getUser, getUserReviews } from "./api/user";
import type { UserProfile } from "./api/types";
import type { Review } from "./types";

export type ProfileStatus = "loading" | "idle" | "error";

export function useProfile(userId: string, enabled = true) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<ProfileStatus>(
    enabled ? "loading" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setStatus("loading");
    setError(null);
    try {
      const [user, page] = await Promise.all([
        getUser(userId, userId),
        getUserReviews(userId, 1, 20, userId),
      ]);
      setProfile(user);
      setReviews(page.results);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [userId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }
    void load();
  }, [enabled, load]);

  return { profile, reviews, status, error, refresh: load };
}
