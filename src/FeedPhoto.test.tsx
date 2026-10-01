import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { FeedPhoto } from './FeedPhoto';
import type { Review } from './types';

const baseReview: Review = {
  id: 3,
  userId: 'caio.garfo',
  restaurantCnpj: '123',
  rating: 4.35,
  comment: 'pastel de feira ainda ganha',
  likes: 61,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function render(props: Partial<Parameters<typeof FeedPhoto>[0]> = {}) {
  const r: ReactTestRenderer = create(
    createElement(FeedPhoto, { review: baseReview, photo: 1, ...props }),
  );
  return { r, text: JSON.stringify(r.toJSON()) };
}

describe('FeedPhoto', () => {
  it('renderiza autor, comentário e restaurante', () => {
    const { text } = render();
    expect(text).toContain('caio.garfo');
    expect(text).toContain('pastel de feira ainda ganha');
    expect(text).toContain('123'); // fallback: sem nome no mapa → CNPJ
  });

  it('mantém testID photo-{id}', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'photo-3' }).length).toBeGreaterThan(0);
  });

  it('mostra nota numérica na escala 0-10', () => {
    const { text } = render();
    expect(text).toContain('8.7');
  });

  it('passa a fonte de imagem recebida para o Image', () => {
    const { r } = render({ photo: 42 });
    expect(r.root.findAllByProps({ source: 42 }).length).toBeGreaterThan(0);
  });

  it('dispara onPress quando recebido (abre página do restaurante)', () => {
    const onPress = vi.fn();
    const { r } = render({ onPress });
    act(() => {
      r.root.findByProps({ testID: 'photo-3' }).props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });

  it('salvar alterna para salvo (estado local do card)', () => {
    const { r } = render();
    const btn = r.root.findByProps({ testID: 'salvar-3' });
    expect(btn.props.accessibilityState.selected).toBe(false);
    act(() => btn.props.onPress());
    expect(r.root.findByProps({ testID: 'salvar-3' }).props.accessibilityState.selected).toBe(true);
    expect(JSON.stringify(r.toJSON())).toContain('salvo');
    act(() => {
      r.root.findByProps({ testID: 'salvar-3' }).props.onPress();
    });
    expect(r.root.findByProps({ testID: 'salvar-3' }).props.accessibilityState.selected).toBe(false);
  });
});
