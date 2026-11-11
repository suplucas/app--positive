import { describe, it, expect } from 'vitest';
import { create } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { StarRating } from './StarRating';
import { palette } from '../common/theme';

const flat = (style: unknown): Record<string, unknown>[] =>
  Array.isArray(style) ? style.flatMap(flat) : [style as Record<string, unknown>];

// Cada célula tem 2 Texts em ordem: estrela-base (vazia) e estrela cheia
// (recortada). Com rating 3: células 1–3 cheias, 4–5 vazias.
function starColors(r: ReturnType<typeof create>): {
  base: (string | undefined)[];
  filled: (string | undefined)[];
} {
  const texts = r.root.findAllByType(Text);
  const colors = texts.map((n) => flat(n.props.style).find((s) => 'color' in s)?.color as string | undefined);
  const base = colors.filter((_, i) => i % 2 === 0);
  const filled = colors.filter((_, i) => i % 2 === 1);
  return { base, filled };
}

describe('StarRating (cor parametrizada, spec 8.4)', () => {
  it('rating null não renderiza', () => {
    const r = create(createElement(StarRating, { rating: null }));
    expect(r.toJSON()).toBeNull();
  });

  it('default mostarda: vazia = mesma cor com alpha 30%', () => {
    const r = create(createElement(StarRating, { rating: 3 }));
    const { base, filled } = starColors(r);
    expect(filled).toEqual(Array(5).fill(palette.mostarda));
    expect(base).toEqual(Array(5).fill(`${palette.mostarda}4D`));
  });

  it('cor customizada propaga para cheia e vazia', () => {
    const r = create(
      createElement(StarRating, { rating: 3, color: palette.picles }),
    );
    const { base, filled } = starColors(r);
    expect(filled).toEqual(Array(5).fill(palette.picles));
    expect(base).toEqual(Array(5).fill(`${palette.picles}4D`));
  });
});
