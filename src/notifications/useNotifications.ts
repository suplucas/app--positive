import { useCallback, useEffect, useState } from 'react';
import type { AppNotification } from '../api/types';
import { getNotifications, markNotificationsRead } from '../api/comment';
import { followUser } from '../api/user';

export type NotificationsStatus = 'loading' | 'idle' | 'error';

// Hook do painel de notificações (spec 8.2): carrega a janela de 30d,
// expõe unreadCount, markRead otimista (a UI marca na hora; a API roda em
// segundo plano e erros são engolidos) e followBack (seguir de volta só
// entra em `following` quando a API confirma). Abrir o painel não marca
// nada — só o tap numa row chama markRead.
export function useNotifications(userId: string): {
  items: AppNotification[];
  unreadCount: number;
  status: NotificationsStatus;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (ids: (string | number)[]) => void;
  followBack: (actorId: string) => Promise<void>;
  following: string[];
} {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<NotificationsStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<string[]>([]);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const page = await getNotifications(userId);
      setItems(page.results);
      setUnreadCount(page.unreadCount);
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Otimista: marca readAt local e recalcula o unreadCount na hora; a
  // chamada da API é fire-and-forget (erro ignora — otimismo vence).
  const markRead = useCallback(
    (ids: (string | number)[]) => {
      if (ids.length === 0) return;
      const now = new Date().toISOString();
      const newlyRead = items.filter(
        (item) =>
          item.readAt == null && item.ids.some((id) => ids.includes(id)),
      ).length;
      setItems((prev) =>
        prev.map((item) =>
          item.readAt == null && item.ids.some((id) => ids.includes(id))
            ? { ...item, readAt: now }
            : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - newlyRead));
      void markNotificationsRead(userId, ids).catch(() => {});
    },
    [userId, items],
  );

  // Erro engolido de propósito: o botão decide por `following` — se a
  // API falhou, ele volta a "seguir de volta" (spec §10).
  const followBack = useCallback(
    async (actorId: string) => {
      try {
        await followUser(userId, actorId);
        setFollowing((prev) =>
          prev.includes(actorId) ? prev : [...prev, actorId],
        );
      } catch {
        // não adiciona em `following`
      }
    },
    [userId],
  );

  return {
    items,
    unreadCount,
    status,
    error,
    refresh: load,
    markRead,
    followBack,
    following,
  };
}
