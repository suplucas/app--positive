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

function textsOf(inst: ReturnType<ReactTestRenderer['root']['findByProps']>): string[] {
  return inst
    .findAll((n) => String(n.type) === 'Text')
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    );
}

describe('FeedPhoto (comentários, docs/12)', () => {
  it('com onComments: botão 💬 abre a thread', () => {
    const onComments = vi.fn();
    const { r } = render({ onComments });
    act(() => {
      r.root.findByProps({ testID: 'comentar-photo-3' }).props.onPress();
    });
    expect(onComments).toHaveBeenCalled();
  });

  it('sem onComments: sem botão de comentário', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'comentar-photo-3' })).toHaveLength(0);
  });
});

function styleOf(r: ReactTestRenderer, testID: string): Record<string, unknown>[] {
  const p = r.root.findByProps({ testID }).props.style as
    | object
    | object[]
    | undefined;
  const flat = (Array.isArray(p) ? p.flat() : p ? [p] : []) as Record<
    string,
    unknown
  >[];
  return flat.filter((s) => s && typeof s === 'object');
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

  describe('variante v2 (teste: linha e nota sobre a imagem)', () => {
    it('autor, restaurante e tempo ficam dentro da imagem (frame)', () => {
      const { r } = render({ variant: 'v2' });
      const frame = r.root.findByProps({ testID: 'photo-3-frame' });
      const texts = textsOf(frame);
      expect(texts).toContain('caio.garfo');
      expect(texts.some((t) => t.includes('em'))).toBe(true);
      expect(r.root.findAllByProps({ testID: 'photo-3-scrim' })).toHaveLength(1);
    });

    it('imagem fica mais alta (480) e a nota vai para o rodapé', () => {
      const { r } = render({ variant: 'v2' });
      expect(
        styleOf(r, 'photo-3-img').some((s) => s.height === 480),
      ).toBe(true);
      expect(
        styleOf(r, 'photo-3-note').some((s) => s.bottom !== undefined),
      ).toBe(true);
    });
  });

  describe('variante v1 (padrão)', () => {
    it('linha fica acima da imagem (fora do frame) e nota no topo', () => {
      const { r } = render();
      const frame = r.root.findByProps({ testID: 'photo-3-frame' });
      expect(textsOf(frame)).not.toContain('caio.garfo');
      expect(r.root.findAllByProps({ testID: 'photo-3-scrim' })).toHaveLength(0);
      expect(styleOf(r, 'photo-3-img').some((s) => s.height === 420)).toBe(true);
      expect(
        styleOf(r, 'photo-3-note').some((s) => s.top !== undefined),
      ).toBe(true);
    });
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
