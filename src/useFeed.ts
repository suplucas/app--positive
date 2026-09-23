import { useCallback, useEffect, useRef, useState } from "react";
import { getFeed } from "./api.js";
import type { FeedStatus, Review } from "./types.js";

const DEFAULT_LIMIT = 20;

export function useFeed(userId: string, limit: number = DEFAULT_LIMIT) {
  const [items, setItems] = useState<Review[]>([]);
  const [status, setStatus] = useState<FeedStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const userRef = useRef(userId);
  const busyRef = useRef(false);

  userRef.current = userId;

  const loadPage = useCallback(
    async (page: number, mode: "replace" | "append") => {
      if (mode === "append" && busyRef.current) return;
      busyRef.current = true;
      const requestedUser = userRef.current;
      setStatus(mode === "replace" ? "loading" : "loading-more");
      setError(null);
      try {
        const data = await getFeed(requestedUser, page, limit);
        if (userRef.current !== requestedUser) return; // stale
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
        if (userRef.current !== requestedUser) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      } finally {
        busyRef.current = false;
      }
    },
    [limit],
  );

  const refresh = useCallback(async () => {
    await loadPage(1, "replace");
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || status === "empty") return;
    await loadPage(pageRef.current + 1, "append");
  }, [hasMore, status, loadPage]);

  // initial load + reload on user change
  useEffect(() => {
    pageRef.current = 1;
    setItems([]);
    setHasMore(true);
    setStatus("loading");
    setError(null);
    void loadPage(1, "replace");
  }, [userId, loadPage]);

  return { items, status, error, hasMore, refresh, loadMore };
}
