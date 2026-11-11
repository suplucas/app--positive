import { afterEach, describe, expect, it, vi } from 'vitest';
import { getNotifications, markNotificationsRead } from './comment';
import type { AppNotification } from './types';

const notification: AppNotification = {
  id: 'n1',
  ids: ['n1'],
  type: 'like',
  actorId: 'caio.garfo',
  actors: [
    {
      id: 'caio.garfo',
      name: 'Caio',
      handle: 'caio.garfo',
      photoUrl: null,
    },
  ],
  count: 1,
  reviewId: 10,
  restaurantId: '123',
  previewText: null,
  readAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getNotifications (painel v1, spec 6.5)', () => {
  it('bate GET /notifications e devolve a resposta enriquecida', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 1,
        unreadCount: 1,
        withinDays: 30,
        results: [notification],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await getNotifications('user_1', 'http://api.test');

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/notifications');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: expect.objectContaining({ 'x-user-id': 'user_1' }),
    });
    expect(res.total).toBe(1);
    expect(res.unreadCount).toBe(1);
    expect(res.withinDays).toBe(30);
    expect(res.results).toHaveLength(1);
    expect(res.results[0]?.type).toBe('like');
  });
});

describe('markNotificationsRead', () => {
  it('faz POST /notifications/read com body { ids }', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ read: true, updated: 2 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await markNotificationsRead(
      'user_1',
      ['n1', 'n2'],
      'http://api.test',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/notifications/read',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-user-id': 'user_1' }),
        body: JSON.stringify({ ids: ['n1', 'n2'] }),
      }),
    );
    expect(res).toEqual({ read: true, updated: 2 });
  });
});
