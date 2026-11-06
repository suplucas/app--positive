import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateUserProfile } from './user';

afterEach(() => {
  vi.unstubAllGlobals();
});

const profile = {
  id: 'user_1',
  name: 'Bea Nova',
  username: 'bea',
  bio: 'bio nova',
  photoUrl: '/uploads/a.jpg',
  isFollowing: false,
  stats: { reviews: 0, followers: 0, following: 0, notaMedia: null },
};

describe('updateUserProfile', () => {
  it('faz PUT /users/:id com x-user-id e body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => profile });
    vi.stubGlobal('fetch', fetchMock);

    const res = await updateUserProfile(
      'user_1',
      { name: 'Bea Nova', bio: 'bio nova' },
      'http://api.test',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/users/user_1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'x-user-id': 'user_1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ name: 'Bea Nova', bio: 'bio nova' }),
      }),
    );
    expect(res.name).toBe('Bea Nova');
  });

  it('lança em non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }),
    );
    await expect(
      updateUserProfile('user_1', { name: 'x' }, 'http://api.test'),
    ).rejects.toThrow(/403/);
  });
});
