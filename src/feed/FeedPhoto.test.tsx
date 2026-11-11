import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { Bookmark, Heart, MessageCircle, Star } from 'lucide-react-native';
import { FeedPhoto } from './FeedPhoto';
import { palette } from '../common/theme';
import type { Review } from '../common/types';

const baseReview: Review = {
  id: 3,
  userId: 'caio.garfo',
  restaurantId: '123',
  rating: 4.35,
  comment: 'pastel de feira ainda ganha',
  title: 'Jantar no Picles',
  likes: 61,
  createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
};

function render(props: Partial<Parameters<typeof FeedPhoto>[0]> = {}) {
  const r: ReactTestRenderer = create(
    createElement(FeedPhoto, {
      review: baseReview,
      photos: [1],
      ...props,
    }),
  );
  return { r, text: JSON.stringify(r.toJSON()) };
}

// Scroll da página de carrossel (width simulado = 390 no stub do RN).
function scrollPage(r: ReactTestRenderer, page: number) {
  act(() => {
    r.root.findByProps({ testID: 'carousel-3' }).props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: page * 390 } },
    });
  });
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

// Texts com onTextLayout = corpo do ReadMoreText (descrição do overlay).
function readMoreBodies(r: ReactTestRenderer) {
  return r.root
    .findAllByType(Text)
    .filter((n) => typeof n.props.onTextLayout === 'function');
}

function styleOf(
  r: ReactTestRenderer,
  testID: string,
): Record<string, unknown>[] {
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

describe('FeedPhoto (spec 8.3 — overlay com título, gradiente e ações)', () => {
  it('mantém testID photo-{id} e dispara onPress (abre restaurante)', () => {
    const onPress = vi.fn();
    const { r } = render({ onPress });
    expect(r.root.findAllByProps({ testID: 'photo-3' }).length).toBeGreaterThan(
      0,
    );
    act(() => {
      r.root.findByProps({ testID: 'photo-3' }).props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });

  it('header: @handle do author, restaurante e location', () => {
    const { r } = render({
      review: {
        ...baseReview,
        author: {
          id: 'caio.garfo',
          name: 'Caio',
          handle: 'caio.garfo',
          photoUrl: null,
        },
        restaurant: {
          id: '123',
          name: 'Bar do Luiz',
          location: 'São Paulo',
        },
      },
    });
    const texts = allTexts(r);
    expect(texts.some((s) => s.includes('@caio.garfo'))).toBe(true);
    expect(texts.some((s) => s.includes('Bar do Luiz'))).toBe(true);
    expect(texts.some((s) => s.includes('São Paulo'))).toBe(true);
  });

  it('header: sem author enriquecido usa userId; sem restaurant usa fallback', () => {
    const { r } = render();
    const texts = allTexts(r);
    expect(texts.some((s) => s.includes('@caio.garfo'))).toBe(true);
    expect(texts.some((s) => s.includes('123'))).toBe(true);
  });

  it('avatar: author.photoUrl vira foto de perfil', () => {
    const { r } = render({
      review: {
        ...baseReview,
        author: {
          id: 'caio.garfo',
          name: 'Caio',
          handle: 'caio.garfo',
          photoUrl: '/avatars/caio.jpg',
        },
      },
    });
    const imgs = r.root.findAll(
      (n) =>
        n.props?.source &&
        typeof n.props.source === 'object' &&
        String(n.props.source.uri ?? '').includes('/avatars/caio.jpg'),
    );
    expect(imgs.length).toBeGreaterThan(0);
  });

  it('mostra estrelas de avaliação', () => {
    const { r } = render();
    expect(r.root.findAllByType(Star).length).toBeGreaterThanOrEqual(5);
  });

  describe('overlay: título + descrição (fallback D1)', () => {
    it('com title: título em cima + descrição via ReadMoreText', () => {
      const { r, text } = render();
      expect(text).toContain('Jantar no Picles');
      expect(text).toContain('pastel de feira ainda ganha');
      const bodies = readMoreBodies(r);
      expect(bodies).toHaveLength(1);
      expect(String(bodies[0]!.props.children)).toBe(
        'pastel de feira ainda ganha',
      );
    });

    it('sem title: título = comment e sem descrição', () => {
      const { r, text } = render({
        review: { ...baseReview, title: null },
      });
      expect(text).toContain('pastel de feira ainda ganha');
      expect(readMoreBodies(r)).toHaveLength(0);
    });
  });

  it('gradiente presente sobre a foto (LinearGradient no JSON)', () => {
    const { r, text } = render();
    expect(text).toContain('LinearGradient');
    const scrim = r.root.findAll(
      (n) => String(n.type) === 'LinearGradient',
    );
    expect(scrim.length).toBeGreaterThan(0);
    expect(
      JSON.stringify(scrim.map((n) => n.props.colors ?? n.props.children)),
    ).toContain('rgba(0,0,0,0.72)');
  });

  it('imagem tem aspect-ratio 4:5 (altura > 400 no stub)', () => {
    const { r } = render();
    const heights = styleOf(r, 'photo-3-img')
      .map((s) => s.height)
      .filter((h) => typeof h === 'number');
    expect(heights.some((h) => Number(h) > 400)).toBe(true);
  });

  describe('carrossel de mock (docs/15)', () => {
    it('1 foto: sem UI de carrossel', () => {
      const { r } = render();
      expect(r.root.findAllByProps({ testID: 'carousel-3' })).toHaveLength(0);
      expect(
        r.root.findAllByProps({ testID: 'carousel-count-3' }),
      ).toHaveLength(0);
    });

    it('2 fotos: contador 1/2, 2 dots e as 2 imagens na fila', () => {
      const { r } = render({ photos: [1, 2] });
      expect(r.root.findAll((n) => String(n.type) === 'Image').length).toBe(2);
      expect(r.root.findByProps({ testID: 'carousel-count-3' })).toBeTruthy();
      expect(
        r.root.findAllByProps({ testID: 'carousel-dot-3-0' }).length +
          r.root.findAllByProps({ testID: 'carousel-dot-3-1' }).length,
      ).toBe(2);
      expect(JSON.stringify(r.toJSON())).toContain('1/2');
    });

    it('scroll para a página 2 atualiza o contador', () => {
      const { r } = render({ photos: [1, 2] });
      scrollPage(r, 1);
      expect(JSON.stringify(r.toJSON())).toContain('2/2');
    });
  });

  describe('ações (spec 8.3)', () => {
    it('curtir: Heart preenchido lambeLambe + count = likes + 1; não repete', () => {
      const onLike = vi.fn();
      const { r } = render({ onLike });
      const btn = r.root.findByProps({ testID: 'like-photo-3' });
      expect(btn.findByType(Heart).props.fill).toBeUndefined();
      act(() => {
        btn.props.onPress();
      });
      expect(btn.findByType(Heart).props.fill).toBe(palette.lambeLambe);
      expect(btn.findByType(Heart).props.color).toBe(palette.lambeLambe);
      expect(JSON.stringify(r.toJSON())).toContain('62');
      act(() => {
        r.root.findByProps({ testID: 'like-photo-3' }).props.onPress();
      });
      const text2 = JSON.stringify(r.toJSON());
      expect(text2).toContain('62'); // não soma de novo
      expect(onLike).toHaveBeenCalledTimes(1);
    });

    it('comentar: MessageCircle com commentCount do enriquecimento', () => {
      const onComments = vi.fn();
      const { r, text } = render({
        onComments,
        review: { ...baseReview, commentCount: 12 },
      });
      expect(
        r.root.findByProps({ testID: 'comentar-photo-3' }).findByType(
          MessageCircle,
        ),
      ).toBeTruthy();
      expect(text).toContain('12');
      act(() => {
        r.root.findByProps({ testID: 'comentar-photo-3' }).props.onPress();
      });
      expect(onComments).toHaveBeenCalled();
    });

    it('com commentCount ausente: MessageCircle sem número', () => {
      const { r } = render({ onComments: () => {} });
      const btn = r.root.findByProps({ testID: 'comentar-photo-3' });
      expect(btn.findByType(MessageCircle)).toBeTruthy();
      // sem commentCount → nenhum Text com '0' solto ao lado do ícone
      const counts = btn
        .findAllByType(Text)
        .map((n) => String(n.props.children));
      expect(counts).toEqual(['']);
    });

    it('sem onComments: sem botão de comentário', () => {
      const { r } = render();
      expect(
        r.root.findAllByProps({ testID: 'comentar-photo-3' }),
      ).toHaveLength(0);
    });

    it('salvar controlado: saved prop manda; tap só chama onSave', () => {
      const onSave = vi.fn();
      const { r } = render({ onSave, saved: true });
      const btn = r.root.findByProps({ testID: 'salvar-3' });
      expect(btn.findByType(Bookmark).props.fill).toBe(palette.mostarda);
      expect(btn.findByType(Bookmark).props.color).toBe(palette.mostarda);
      expect(btn.props.accessibilityState.selected).toBe(true);
      act(() => {
        btn.props.onPress();
      });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(btn.findByType(Bookmark).props.fill).toBe(palette.mostarda); // continua salvo
    });

    it('salvar não controlado: alterna estado local do card', () => {
      const onSave = vi.fn();
      const { r } = render({ onSave });
      const btn = r.root.findByProps({ testID: 'salvar-3' });
      expect(btn.props.accessibilityState.selected).toBe(false);
      expect(btn.findByType(Bookmark).props.fill).toBeUndefined();
      act(() => {
        btn.props.onPress();
      });
      expect(
        r.root.findByProps({ testID: 'salvar-3' }).props.accessibilityState
          .selected,
      ).toBe(true);
      expect(btn.findByType(Bookmark).props.fill).toBe(palette.mostarda);
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  it('tempo relativo por extenso (há 3h) na linha abaixo das ações', () => {
    const { text } = render();
    expect(text).toContain('há 3h');
  });

  it('sem flair e sem borda: marginBottom 24 e sem borderBottomWidth', () => {
    const { r } = render({
      review: { ...baseReview, flairs: ['volto sim'] },
    });
    expect(r.root.findAllByProps({ testID: 'flair-forte' })).toHaveLength(0);
    expect(r.root.findAllByProps({ testID: 'flair-quieto' })).toHaveLength(0);
    expect(allTexts(r)).not.toContain('volto sim');
    const styles = styleOf(r, 'photo-3');
    const hasBorder = styles.some((s) => s.borderBottomWidth != null);
    expect(hasBorder).toBe(false);
    const hasMargin24 = styles.some((s) => s.marginBottom === 24);
    expect(hasMargin24).toBe(true);
  });
});
