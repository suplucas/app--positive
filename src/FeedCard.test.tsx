import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { FeedCard } from './FeedCard';
import type { Review } from './types';

const baseReview: Review = {
  id: 1,
  userId: 'user_1',
  restaurantCnpj: '123',
  rating: 5,
  comment: 'ótimo',
  likes: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function render(props: Partial<Parameters<typeof FeedCard>[0]> = {}) {
  const r: ReactTestRenderer = create(
    createElement(FeedCard, { review: baseReview, ...props }),
  );
  return { r, text: JSON.stringify(r.toJSON()) };
}

describe('FeedCard (comentários, docs/12)', () => {
  it('com onComments: botão 💬 abre a thread', () => {
    const onComments = vi.fn();
    const { r } = render({ onComments });
    act(() => {
      r.root.findByProps({ testID: 'comentar-card-1' }).props.onPress();
    });
    expect(onComments).toHaveBeenCalled();
  });

  it('sem onComments: sem botão de comentário', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'comentar-card-1' })).toHaveLength(0);
  });
});

describe('FeedCard', () => {
  it('renderiza campos do review', () => {
    const { text } = render();
    expect(text).toContain('user_1');
    expect(text).toContain('ótimo');
    expect(text).toContain('123'); // fallback: sem nome no mapa → CNPJ
  });

  it('mantém testID card-{id}', () => {
    const { r } = render();
    const tree = r.root;
    expect(tree.findAllByProps({ testID: 'card-1' }).length).toBeGreaterThan(0);
  });

  it('mostra nota numérica na escala 0-10', () => {
    const { text } = render();
    expect(text).toContain('10.0');
  });

  it('flair quieto por padrão', () => {
    const { text } = render();
    expect(text).toContain('boa pra ir só');
    expect(text).not.toContain('chorei de tão bom');
  });

  it('flair forte quando marcado (máx 1 por tela é responsabilidade de App)', () => {
    const { text } = render({ strong: true });
    expect(text).toContain('chorei de tão bom');
  });

  it('sem flair forte não usa cor cheia', () => {
    const { r } = render();
    const strong = r.root.findAllByProps({ testID: 'flair-forte' });
    expect(strong).toHaveLength(0);
  });

  it('dispara onPress quando recebido (abre página do restaurante)', () => {
    const onPress = vi.fn();
    const { r } = render({ onPress });
    act(() => {
      r.root.findByProps({ testID: 'card-1' }).props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });

  it('sem onPress, o card não expõe ação', () => {
    const { r } = render();
    expect(r.root.findByProps({ testID: 'card-1' }).props.onPress).toBeUndefined();
  });
});
