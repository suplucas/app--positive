import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { useNotifications } from './useNotifications';
import { getNotifications, markNotificationsRead } from '../api/comment';
import { followUser } from '../api/user';
import type { AppNotification } from '../api/types';

vi.mock('../api/comment', () => ({
  getNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
}));
vi.mock('../api/user', () => ({
  followUser: vi.fn(),
}));

const n1: AppNotification = {
  id: 'n1',
  ids: ['n1'],
  type: 'like',
  actorId: 'bea',
  actors: [{ id: 'bea', name: 'Bea', handle: 'bea', photoUrl: null }],
  count: 1,
  reviewId: 10,
  restaurantId: '123',
  previewText: null,
  readAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};
const n2: AppNotification = {
  ...n1,
  id: 'n2',
  ids: ['n2'],
  type: 'follow',
  readAt: '2026-01-01T01:00:00.000Z',
};

// Sonda: guarda o hook do último render numa var de módulo e imprime o
// estado resumido como children.
let api: ReturnType<typeof useNotifications> | null = null;
function Probe({ userId }: { userId: string }) {
  api = useNotifications(userId);
  return createElement(Text, {
    testID: 'probe',
    children: JSON.stringify({
      n: api.items.length,
      unread: api.unreadCount,
      status: api.status,
      error: api.error,
      following: api.following,
      readAt0: api.items[0]?.readAt ?? null,
    }),
  });
}

async function render(userId = 'u1'): Promise<ReactTestRenderer> {
  const r = create(createElement(Probe, { userId }));
  await act(async () => {});
  return r;
}

const state = (r: ReactTestRenderer) =>
  JSON.parse(
    String(r.root.findByProps({ testID: 'probe' }).props.children),
  ) as {
    n: number;
    unread: number;
    status: string;
    error: string | null;
    following: string[];
    readAt0: string | null;
  };

beforeEach(() => {
  vi.mocked(getNotifications)
    .mockReset()
    .mockResolvedValue({
      total: 2,
      unreadCount: 1,
      withinDays: 30,
      results: [n1, n2],
    });
  vi.mocked(markNotificationsRead).mockReset().mockResolvedValue({
    read: true,
    updated: 1,
  });
  vi.mocked(followUser).mockReset().mockResolvedValue({ following: true });
});

describe('useNotifications (painel v1, spec 8.2)', () => {
  it('carrega lista e unreadCount', async () => {
    const r = await render();
    const s = state(r);
    expect(s.n).toBe(2);
    expect(s.unread).toBe(1);
    expect(s.status).toBe('idle');
    expect(getNotifications).toHaveBeenCalledWith('u1');
  });

  it('erro de carga: status error + mensagem', async () => {
    vi.mocked(getNotifications).mockRejectedValue(
      new Error('GET /notifications: invalid payload'),
    );
    const r = await render();
    const s = state(r);
    expect(s.status).toBe('error');
    expect(s.error).toContain('invalid payload');
    expect(s.n).toBe(0);
  });

  it('markRead é otimista: marca readAt local e dispara a API', async () => {
    const r = await render();
    expect(state(r).readAt0).toBeNull();
    await act(async () => {
      api!.markRead(['n1', 'n2']);
    });
    expect(state(r).readAt0).not.toBeNull();
    expect(markNotificationsRead).toHaveBeenCalledWith('u1', ['n1', 'n2']);
  });

  it('markRead: falha da API não desfaz o otimismo', async () => {
    vi.mocked(markNotificationsRead).mockRejectedValue(
      new Error('POST failed: 500'),
    );
    const r = await render();
    await act(async () => {
      api!.markRead(['n1']);
    });
    expect(state(r).readAt0).not.toBeNull();
  });

  it('followBack com sucesso adiciona a following', async () => {
    const r = await render();
    expect(state(r).following).toEqual([]);
    await act(async () => {
      await api!.followBack('bea');
    });
    expect(state(r).following).toContain('bea');
    expect(followUser).toHaveBeenCalledWith('u1', 'bea');
  });

  it('followBack com falha não adiciona (botão volta)', async () => {
    vi.mocked(followUser).mockRejectedValue(new Error('POST failed: 500'));
    const r = await render();
    await act(async () => {
      await api!.followBack('bea');
    });
    expect(state(r).following).toEqual([]);
  });

  it('abrir o painel não marca nada: nada é chamado além da carga', async () => {
    await render();
    expect(markNotificationsRead).not.toHaveBeenCalled();
  });

  it('unreadCount atualiza depois do markRead', async () => {
    const r = await render();
    expect(state(r).unread).toBe(1);
    await act(async () => {
      api!.markRead(['n1']);
    });
    expect(state(r).unread).toBe(0);
  });
});
