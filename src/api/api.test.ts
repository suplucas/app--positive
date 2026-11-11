import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFeed, getReview, likeReview, postReview } from './api';

const okBody = {
  page: 1,
  limit: 20,
  results: [
    {
      id: 1,
      userId: 'user_1',
      restaurantId: '123',
      rating: 5,
      comment: 'ok',
      likes: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getFeed', () => {
  it('monta URL, headers e devolve JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => okBody,
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await getFeed('user_1', 2, 20, 'http://api.test');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/feed?page=2&limit=20',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-user-id': 'user_1' }),
      }),
    );
    expect(res.results).toHaveLength(1);
    expect(res.page).toBe(1);
  });

  it('lança em non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    await expect(getFeed('user_1', 1, 20, 'http://api.test')).rejects.toThrow(
      /500/,
    );
  });

  it('lança quando JSON inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('bad json');
        },
      }),
    );
    await expect(getFeed('user_1', 1, 20, 'http://api.test')).rejects.toThrow(
      /bad json/,
    );
  });

  it('usa EXPO_PUBLIC_API_URL por default', async () => {
    const prev = process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_API_URL = 'http://from-env';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => okBody,
    });
    vi.stubGlobal('fetch', fetchMock);
    await getFeed('user_1', 1, 20);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://from-env/feed?page=1&limit=20',
    );
    if (prev === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = prev;
  });
});

describe('likeReview', () => {
  it('faz POST /reviews/:id/like com x-user-id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 7, likes: 4 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(likeReview('user_1', 7, 'http://api.test')).resolves.toEqual({
      id: 7,
      likes: 4,
    });
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/reviews/7/like');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({ 'x-user-id': 'user_1' }),
    });
  });
});

describe('getReview', () => {
  const reviewBody = {
    id: 12,
    userId: 'user_1',
    restaurantId: '123',
    rating: 4.5,
    comment: 'pastel de feira',
    title: 'Pastel da feira',
    likes: 3,
    commentCount: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('bate GET /reviews/:id e devolve o payload validado', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => reviewBody,
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await getReview(12, 'http://api.test');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/reviews/12',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Accept: 'application/json' }),
      }),
    );
    expect(res.id).toBe(12);
    expect(res.title).toBe('Pastel da feira');
  });

  it('lança quando payload não tem id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    await expect(getReview(12, 'http://api.test')).rejects.toThrow(
      /invalid payload/,
    );
  });
});

describe('postReview', () => {
  const created = {
    id: 99,
    userId: 'user_19',
    restaurantId: '123',
    rating: 4,
    comment: 'bom',
    title: 'Jantar no Picles',
    likes: 0,
    createdAt: '2026-09-24T00:00:00.000Z',
  };

  it('monta URL, method, headers e body (com title)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => created,
    });
    vi.stubGlobal('fetch', fetchMock);

    const r = await postReview(
      'user_19',
      {
        restaurantId: '123',
        rating: 4,
        comment: 'bom',
        title: 'Jantar no Picles',
      },
      'http://api.test',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/reviews',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-user-id': 'user_19',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          restaurantId: '123',
          rating: 4,
          comment: 'bom',
          title: 'Jantar no Picles',
        }),
      }),
    );
    expect(r.id).toBe(99);
  });

  it('lança em non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      }),
    );
    await expect(
      postReview(
        'user_1',
        { restaurantId: '1', rating: 3, comment: null, title: 'Título' },
        'http://api.test',
      ),
    ).rejects.toThrow(/400/);
  });

  it('lança quando payload inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ sem: 'id' }),
      }),
    );
    await expect(
      postReview(
        'user_1',
        { restaurantId: '1', rating: 3, comment: null, title: 'Título' },
        'http://api.test',
      ),
    ).rejects.toThrow(/invalid payload/);
  });
});
