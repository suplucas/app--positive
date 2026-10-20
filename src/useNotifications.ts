import { useCallback, useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "./api/comment";
import type { AppNotification } from "./api/types";

export type NotificationsStatus = "loading" | "idle" | "error";

export function useNotifications(userId: string) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [status, setStatus] = useState<NotificationsStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const page = await getNotifications(userId);
      setItems(page.results);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(
    async (id: string | number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
      await markNotificationRead(userId, id);
    },
    [userId],
  );

  return { items, status, error, refresh: load, markRead };
}
