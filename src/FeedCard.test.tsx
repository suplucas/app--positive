import { describe, it, expect } from 'vitest';
import { create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { FeedCard } from './FeedCard.js';

describe('FeedCard', () => {
  it('renderiza campos do review', () => {
    const r: ReactTestRenderer = create(
      createElement(FeedCard, {
        review: {
          id: 1,
          userId: 'user_1',
          restaurantCnpj: '123',
          rating: 5,
          comment: 'ótimo',
          likes: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      }),
    );
    const text = JSON.stringify(r.toJSON());
    expect(text).toContain('user_1');
    expect(text).toContain('ótimo');
    expect(text).toContain('123');
  });
});
