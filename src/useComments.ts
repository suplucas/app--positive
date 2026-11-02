import { useCallback, useEffect, useState } from "react";
import { addComment, getComments } from "./api/comment";
import type { ReviewComment } from "./api/types";

export type CommentsStatus = "loading" | "idle" | "error";

export function useComments(reviewId: string | number, authorId?: string) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [status, setStatus] = useState<CommentsStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const page = await getComments(reviewId);
      setComments(page.results);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [reviewId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const created = await addComment(reviewId, authorId ?? "você", trimmed);
      setComments((prev) => [...prev, created]);
    },
    [reviewId, authorId],
  );

  return { comments, status, error, refresh: load, send };
}
