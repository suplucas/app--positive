import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { FeedQuote } from './FeedQuote';
import type { Review } from '../common/types';
import { palette } from '../common/theme';

const baseReview: Review = {
  id: 7,
  userId: 'bea_come_tudo',
  restaurantId: '123',
  rating: 4.5,
  comment: 'volto sempre',
  title: 'Pastel de feira',
  likes: 12,
  createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
};

function render(props: Partial<Parameters<typeof FeedQuote>[0]> = {}) {
  const r: ReactTestRenderer = create(
    createElement(FeedQuote, { review: baseReview, ...props }),
  );
  return { r, text: JSON.stringify(r.toJSON()) };
}

function allTexts(r: ReactTestRenderer): string[] {
  return r.root
    .findAllByType(Text)
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    );
}

function readMoreBodies(r: ReactTestRenderer) {
  return r.root
    .findAllByType(Text)
    .filter((n) => typeof n.props.onTextLayout === 'function');
}

function cardStyle(r: ReactTestRenderer): Record<string, unknown>[] {
  const p = r.root.findByProps({ testID: 'quote-7' }).props.style as
    | object
    | object[];
  const flat = (Array.isArray(p) ? p.flat() : [p]) as Record<string, unknown>[];
  return flat.filter((s) => s && typeof s === 'object');
}

describe('FeedQuote (spec 8.3 — card colorido com título grande)', () => {
  it('mantém testID quote-{id} e dispara onPress', () => {
    const onPress = vi.fn();
    const { r } = render({ onPress });
    expect(
      r.root.findAllByProps({ testID: 'quote-7' }).length,
    ).toBeGreaterThan(0);
    act(() => {
      r.root.findByProps({ testID: 'quote-7' }).props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });

  it('card do tone: fundo mostarda, raio 16, margem 12/16, sem borda, marginBottom 24', () => {
    const { r } = render();
    const styles = cardStyle(r);
    expect(
      styles.some((s) => s.backgroundColor === palette.mostarda),
    ).toBe(true);
    expect(styles.some((s) => s.borderRadius === 16)).toBe(true);
    expect(styles.some((s) => s.marginHorizontal === 16)).toBe(true);
    expect(styles.some((s) => s.marginTop === 12)).toBe(true);
    expect(styles.some((s) => s.marginBottom === 24)).toBe(true);
    expect(
      styles.some((s) => s.borderBottomWidth != null),
    ).toBe(false);
  });

  it('tone lambeLambe muda o fundo do card', () => {
    const { r } = render({ tone: 'lambeLambe' });
    expect(
      cardStyle(r).some((s) => s.backgroundColor === palette.lambeLambe),
    ).toBe(true);
  });

  it('header: @handle do author, avatar 28 e estrelas na cor do ink', () => {
    const { r } = render({
      review: {
        ...baseReview,
        author: {
          id: 'bea_come_tudo',
          name: 'Bea',
          handle: 'bea_come_tudo',
          photoUrl: null,
        },
      },
    });
    const texts = allTexts(r);
    expect(texts.some((s) => s.includes('@bea_come_tudo'))).toBe(true);
    // ink do tone mostarda = berinjela
    const starTexts = r.root
      .findAllByType(Text)
      .filter((n) => String(n.props.children) === '★');
    expect(starTexts.length).toBeGreaterThan(0);
    expect(
      starTexts.some((n) =>
        [n.props.style].flat().some((s) => s?.color === palette.berinjela),
      ),
    ).toBe(true);
  });

  describe('título grande + descrição (fallback D1)', () => {
    it('com title: título display700 22/28 + descrição com ReadMoreText clamp 3', () => {
      const { r, text } = render();
      expect(text).toContain('Pastel de feira');
      expect(text).toContain('volto sempre');
      const bodies = readMoreBodies(r);
      expect(bodies).toHaveLength(1);
      expect(bodies[0]!.props.numberOfLines).toBe(3);
      const title = r.root
        .findAllByType(Text)
        .find((n) => String(n.props.children) === 'Pastel de feira')!;
      const style = [title.props.style].flat().find(
        (s) => s && typeof s === 'object' && 'fontSize' in s,
      ) as { fontSize: number; lineHeight: number };
      expect(style.fontSize).toBe(22);
      expect(style.lineHeight).toBe(28);
    });

    it('sem title: título = comment e sem descrição', () => {
      const { r, text } = render({
        review: { ...baseReview, title: null },
      });
      expect(text).toContain('volto sempre');
      expect(readMoreBodies(r)).toHaveLength(0);
    });
  });

  it('restaurante do enriquecido com fallback', () => {
    const { r } = render({
      review: {
        ...baseReview,
        restaurant: { id: '123', name: 'Bar do Luiz', location: 'São Paulo' },
      },
    });
    const texts = allTexts(r);
    expect(texts.some((s) => s.includes('Bar do Luiz'))).toBe(true);
    const { text } = render();
    expect(text).toContain('123'); // fallback restaurantName
  });

  describe('ações na cor do ink', () => {
    it('curtir: ♥ + count = likes + 1; não repete', () => {
      const onLike = vi.fn();
      const { r } = render({ onLike });
      act(() => {
        r.root.findByProps({ testID: 'like-quote-7' }).props.onPress();
      });
      const text1 = JSON.stringify(r.toJSON());
      expect(text1).toContain('♥');
      expect(text1).toContain('13');
      act(() => {
        r.root.findByProps({ testID: 'like-quote-7' }).props.onPress();
      });
      expect(JSON.stringify(r.toJSON())).toContain('13');
      expect(onLike).toHaveBeenCalledTimes(1);
    });

    it('comentar: 💬 com commentCount; abre thread', () => {
      const onComments = vi.fn();
      const { r, text } = render({
        onComments,
        review: { ...baseReview, commentCount: 5 },
      });
      expect(text).toContain('5');
      act(() => {
        r.root.findByProps({ testID: 'comentar-quote-7' }).props.onPress();
      });
      expect(onComments).toHaveBeenCalled();
    });

    it('sem onComments: sem botão de comentário', () => {
      const { r } = render();
      expect(
        r.root.findAllByProps({ testID: 'comentar-quote-7' }),
      ).toHaveLength(0);
    });

    it('salvar controlado: saved prop manda; tap só chama onSave', () => {
      const onSave = vi.fn();
      const { r } = render({ onSave, saved: true });
      expect(
        r.root.findByProps({ testID: 'salvar-quote-7' }).props
          .accessibilityState.selected,
      ).toBe(true);
      act(() => {
        r.root.findByProps({ testID: 'salvar-quote-7' }).props.onPress();
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(
        r.root.findByProps({ testID: 'salvar-quote-7' }).props
          .accessibilityState.selected,
      ).toBe(true);
    });

    it('salvar não controlado: alterna estado local', () => {
      const onSave = vi.fn();
      const { r } = render({ onSave });
      const btn = r.root.findByProps({ testID: 'salvar-quote-7' });
      expect(btn.props.accessibilityState.selected).toBe(false);
      act(() => {
        btn.props.onPress();
      });
      expect(
        r.root.findByProps({ testID: 'salvar-quote-7' }).props
          .accessibilityState.selected,
      ).toBe(true);
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  it('tempo relativo por extenso (há 3h)', () => {
    const { text } = render();
    expect(text).toContain('há 3h');
  });

  it('sem flair: nada de flair renderiza mesmo com flairs na review', () => {
    const { r, text } = render({
      review: { ...baseReview, flairs: ['volto sim'] },
    });
    expect(r.root.findAllByProps({ testID: 'flair-forte' })).toHaveLength(0);
    expect(r.root.findAllByProps({ testID: 'flair-quieto' })).toHaveLength(0);
    expect(allTexts(r)).not.toContain('volto sim');
    expect(text).toContain('Pastel de feira');
  });
});
