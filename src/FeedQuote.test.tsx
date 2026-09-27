import { describe, it, expect } from 'vitest';
import { create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { FeedQuote } from './FeedQuote';
import type { Review } from './types';

const baseReview: Review = {
  id: 7,
  userId: 'bea_come_tudo',
  restaurantCnpj: '123',
  rating: 4.5,
  comment: 'volto sempre',
  likes: 12,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function render(props: Partial<Parameters<typeof FeedQuote>[0]> = {}) {
  const r: ReactTestRenderer = create(
    createElement(FeedQuote, { review: baseReview, ...props }),
  );
  return { r, text: JSON.stringify(r.toJSON()) };
}

describe('FeedQuote', () => {
  it('renderiza autor, comentário entre aspas e restaurante', () => {
    const { text } = render();
    expect(text).toContain('bea_come_tudo');
    expect(text).toContain('volto sempre');
    expect(text).toContain('123'); // fallback: sem nome no mapa → CNPJ
  });

  it('mantém testID quote-{id}', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'quote-7' }).length).toBeGreaterThan(0);
  });

  it('mostra nota numérica na escala 0-10', () => {
    const { text } = render();
    expect(text).toContain('9.0');
  });

  it('usa o container sem depender de props de tema', () => {
    const { r } = render({ tone: 'lambeLambe' });
    expect(r.toJSON()).toBeTruthy();
  });
});
