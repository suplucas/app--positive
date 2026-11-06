import { describe, expect, it } from 'vitest';
import { decorateFeed } from './decorateFeed';
import type { Review } from '../common/types';

const review = (over: Partial<Review>): Review => ({
  id: 1,
  userId: 'u',
  restaurantId: '1',
  rating: 4,
  comment: 'ok',
  likes: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('decorateFeed', () => {
  it('marca no máximo uma review forte por tela', () => {
    const map = decorateFeed([
      review({ id: 1, rating: 5, layout: 'row' }),
      review({ id: 2, rating: 5, layout: 'row' }),
    ]);
    expect(map.get(1)?.strong).toBe(true);
    expect(map.get(2)?.strong).toBe(false);
  });

  it('foto remota vence o mock', () => {
    const map = decorateFeed([
      review({ id: 3, layout: 'photo', photoUrl: '/f.jpg' }),
    ]);
    expect(map.get(3)?.photos).toHaveLength(1);
    expect(map.get(3)?.photos?.[0]).toMatchObject({
      uri: expect.stringContaining('/f.jpg'),
    });
  });

  it('sem foto e nota baixa vira linha', () => {
    const map = decorateFeed([review({ id: 4, rating: 2, layout: undefined })]);
    expect(map.get(4)?.layout).toBe('row');
  });
});
