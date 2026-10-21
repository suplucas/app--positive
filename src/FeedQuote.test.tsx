import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { FeedQuote } from './FeedQuote';
import type { Review } from './types';

const baseReview: Review = {
  id: 7,
  userId: 'bea_come_tudo',
  restaurantId: '123',
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

describe('FeedQuote (comentários, docs/12)', () => {
  it('com onComments: botão 💬 abre a thread', () => {
    const onComments = vi.fn();
    const { r } = render({ onComments });
    act(() => {
      r.root.findByProps({ testID: 'comentar-quote-7' }).props.onPress();
    });
    expect(onComments).toHaveBeenCalled();
  });

  it('sem onComments: sem botão de comentário', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'comentar-quote-7' })).toHaveLength(0);
  });
});

describe('FeedQuote', () => {
  it('texto longo ganha "continuar lendo" e expande/recolhe', () => {
    const longReview: Review = {
      ...baseReview,
      comment: 'a'.repeat(200),
    };
    const r: ReactTestRenderer = create(
      createElement(FeedQuote, { review: longReview }),
    );
    expect(JSON.stringify(r.toJSON())).toContain('continuar lendo');
    act(() => {
      r.root.findByProps({ testID: 'expand-quote-7' }).props.onPress();
    });
    expect(JSON.stringify(r.toJSON())).toContain('ver menos');
    act(() => {
      r.root.findByProps({ testID: 'expand-quote-7' }).props.onPress();
    });
    expect(JSON.stringify(r.toJSON())).toContain('continuar lendo');
  });

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

  it('dispara onPress quando recebido (abre página do restaurante)', () => {
    const onPress = vi.fn();
    const { r } = render({ onPress });
    act(() => {
      r.root.findByProps({ testID: 'quote-7' }).props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });
});
