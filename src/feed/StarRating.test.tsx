import { describe, it, expect } from 'vitest';
import { create } from 'react-test-renderer';
import { createElement } from 'react';
import { Star } from 'lucide-react-native';
import { StarRating } from './StarRating';
import { palette } from '../common/theme';

// Cada célula tem 2 Stars em ordem: estrela-base (vazia, sem fill) e
// estrela cheia (recortada, color + fill). Com rating 3: células 1–3
// cheias, 4–5 vazias.
function starColors(r: ReturnType<typeof create>): {
  base: (string | undefined)[];
  filled: (string | undefined)[];
} {
  const stars = r.root.findAllByType(Star);
  const base = stars
    .filter((n) => n.props.fill == null)
    .map((n) => n.props.color as string | undefined);
  const filled = stars
    .filter((n) => n.props.fill != null)
    .map((n) => n.props.color as string | undefined);
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
