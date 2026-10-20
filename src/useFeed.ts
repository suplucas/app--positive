import { useCallback, useEffect, useRef, useState } from "react";
import { getFeed, likeReview } from "./api";
import type { FeedStatus, Review } from "./types";

const DEFAULT_LIMIT = 20;

export function useFeed(userId: string, limit: number = DEFAULT_LIMIT) {
  const [items, setItems] = useState<Review[]>([]);
  const [status, setStatus] = useState<FeedStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const userRef = useRef(userId);
  const busyRef = useRef(false);
  const genRef = useRef(0);

  userRef.current = userId;

  const loadPage = useCallback(
    async (page: number, mode: "replace" | "append") => {
      if (mode === "append" && busyRef.current) return;
      if (mode === "replace") genRef.current += 1;
      const gen = genRef.current;
      busyRef.current = true;
      const requestedUser = userRef.current;
      setStatus(mode === "replace" ? "loading" : "loading-more");
      setError(null);
      try {
        const data = await getFeed(requestedUser, page, limit);
        if (userRef.current !== requestedUser || genRef.current !== gen) return; // stale
        pageRef.current = page;
        setHasMore(data.results.length >= limit);
        setItems((prev) =>
          mode === "replace" ? data.results : [...prev, ...data.results],
        );
        if (mode === "replace" && data.results.length === 0) {
          setStatus("empty");
        } else {
          setStatus("idle");
        }
      } catch (e) {
        if (userRef.current !== requestedUser || genRef.current !== gen) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      } finally {
        if (genRef.current === gen) busyRef.current = false;
      }
    },
    [limit],
  );

  const refresh = useCallback(async () => {
    await loadPage(1, "replace");
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || status === "empty" || items.length === 0) return;
    await loadPage(pageRef.current + 1, "append");
  }, [hasMore, status, items.length, loadPage]);

  // Like otimista: soma 1 na hora e desfaz se a API falhar.
  const like = useCallback(
    async (review: Review) => {
      const bump = (delta: number) =>
        setItems((prev) =>
          prev.map((item) =>
            item.id === review.id
              ? { ...item, likes: Math.max(0, item.likes + delta) }
              : item,
          ),
        );
      bump(1);
      try {
        await likeReview(userId, review.id);
      } catch {
        bump(-1);
      }
    },
    [userId],
  );

  // initial load + reload on user change
  useEffect(() => {
    pageRef.current = 1;
    setHasMore(true);
    setError(null);
    setItems([]);
    setStatus("loading");
    void loadPage(1, "replace");
  }, [userId, loadPage]);

  return { items, status, error, hasMore, refresh, loadMore, like };
}
