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

describe('decorateFeed (layout deriva da foto, sem row — spec D2)', () => {
  it('nunca retorna row: item sem foto vira quote', () => {
    const map = decorateFeed([
      review({ id: 1, rating: 2, layout: 'row' }),
      review({ id: 2, rating: 2, layout: undefined }),
    ]);
    expect(map.get(1)?.layout).toBe('quote');
    expect(map.get(2)?.layout).toBe('quote');
  });

  it('photoUrl resolvida → photo com a foto remota', () => {
    const map = decorateFeed([
      review({ id: 3, photoUrl: '/f.jpg', rating: 2 }),
    ]);
    expect(map.get(3)?.layout).toBe('photo');
    expect(map.get(3)?.photos).toHaveLength(1);
    expect(map.get(3)?.photos?.[0]).toMatchObject({
      uri: expect.stringContaining('/f.jpg'),
    });
  });

  it('photoIndex do mock → photo com a foto local', () => {
    const map = decorateFeed([review({ id: 4, photoIndex: 2, rating: 2 })]);
    expect(map.get(4)?.layout).toBe('photo');
    expect(map.get(4)?.photos).toHaveLength(1);
  });

  it('photoIndexes do mock → photo em carrossel (2+ fotos)', () => {
    const map = decorateFeed([
      review({ id: 5, photoIndexes: [0, 1, 2], rating: 2 }),
    ]);
    expect(map.get(5)?.layout).toBe('photo');
    expect(map.get(5)?.photos).toHaveLength(3);
  });

  it('sem fotoUrl e sem fotos de mock → quote (mesmo com layout antigo)', () => {
    const map = decorateFeed([review({ id: 6, layout: 'photo', rating: 5 })]);
    expect(map.get(6)?.layout).toBe('quote');
  });

  it('tones alternam mostarda → picles → lambeLambe por quote', () => {
    const map = decorateFeed([
      review({ id: 7, rating: 2 }),
      review({ id: 8, rating: 2 }),
      review({ id: 9, rating: 2 }),
      review({ id: 10, rating: 2 }),
    ]);
    expect(map.get(7)?.tone).toBe('mostarda');
    expect(map.get(8)?.tone).toBe('picles');
    expect(map.get(9)?.tone).toBe('lambeLambe');
    expect(map.get(10)?.tone).toBe('mostarda'); // reinicia
  });

  it('quotes alternam por índice de quote, não de item (photos não contam)', () => {
    const map = decorateFeed([
      review({ id: 11, photoUrl: '/a.jpg' }), // photo: não incrementa quote
      review({ id: 12, rating: 2 }), // quote 0
      review({ id: 13, photoIndex: 1 }), // photo
      review({ id: 14, rating: 2 }), // quote 1
    ]);
    expect(map.get(11)?.layout).toBe('photo');
    expect(map.get(12)?.tone).toBe('mostarda');
    expect(map.get(13)?.layout).toBe('photo');
    expect(map.get(14)?.tone).toBe('picles');
  });
});
