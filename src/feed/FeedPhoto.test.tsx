import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { FeedPhoto } from './FeedPhoto';
import type { Review } from '../common/types';

const baseReview: Review = {
  id: 3,
  userId: 'caio.garfo',
  restaurantId: '123',
  rating: 4.35,
  comment: 'pastel de feira ainda ganha',
  likes: 61,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function render(props: Partial<Parameters<typeof FeedPhoto>[0]> = {}) {
  const r: ReactTestRenderer = create(
    createElement(FeedPhoto, { review: baseReview, photos: [1], ...props }),
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

function textsOf(
  inst: ReturnType<ReactTestRenderer['root']['findByProps']>,
): string[] {
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
    expect(r.root.findAllByProps({ testID: 'comentar-photo-3' })).toHaveLength(
      0,
    );
  });

  it('com strong renderiza flair-forte', () => {
    const { r } = render({
      review: { ...baseReview, flairs: ['chorei de tão bom'] },
      strong: true,
    });
    expect(r.root.findAllByProps({ testID: 'flair-forte' })).toHaveLength(1);
  });
});

function styleOf(
  r: ReactTestRenderer,
  testID: string,
): Record<string, unknown>[] {
  const p = r.root.findByProps({ testID }).props.style as
    object | object[] | undefined;
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
    expect(r.root.findAllByProps({ testID: 'photo-3' }).length).toBeGreaterThan(
      0,
    );
  });

  it('mostra estrelas de avaliação', () => {
    const { text } = render();
    expect(text).toContain('★');
  });

  it('passa a fonte de imagem recebida para o Image', () => {
    const { r } = render({ photos: [42] });
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

  describe('layout final (header + foto com overlay)', () => {
    it('autor e restaurante ficam no header (acima da foto)', () => {
      const { r } = render();
      const frame = r.root.findByProps({ testID: 'photo-3-frame' });
      // author row is outside the frame now
      const texts = textsOf(frame);
      expect(texts).not.toContain('caio.garfo');
      // scrim still exists inside the frame
      expect(r.root.findAllByProps({ testID: 'photo-3-scrim' })).toHaveLength(
        1,
      );
    });

    it('imagem tem aspect-ratio 4:5 (altura > 400 no stub)', () => {
      const { r } = render();
      // useWindowDimensions stub returns width=390, so height = 390*5/4 = 487
      const heights = styleOf(r, 'photo-3-img')
        .map((s) => s.height)
        .filter((h) => typeof h === 'number');
      expect(heights.some((h) => Number(h) > 400)).toBe(true);
    });
  });

  describe('carrossel (docs/15)', () => {
    it('1 foto: sem UI de carrossel (comportamento atual)', () => {
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
      // contador inicia na página 1
      expect(JSON.stringify(r.toJSON())).toContain('1/2');
    });

    it('scroll para a página 2 atualiza o contador', () => {
      const { r } = render({ photos: [1, 2] });
      scrollPage(r, 1);
      expect(JSON.stringify(r.toJSON())).toContain('2/2');
    });

    it('2 fotos: scrim existe e carrossel funciona', () => {
      const { r } = render({ photos: [1, 2] });
      expect(r.root.findAllByProps({ testID: 'photo-3-scrim' })).toHaveLength(
        1,
      );
      // carrossel funcional
      scrollPage(r, 1);
      expect(JSON.stringify(r.toJSON())).toContain('2/2');
    });
  });

  it('salvar alterna para salvo (estado local do card)', () => {
    const { r } = render();
    const btn = r.root.findByProps({ testID: 'salvar-3' });
    expect(btn.props.accessibilityState.selected).toBe(false);
    act(() => btn.props.onPress());
    expect(
      r.root.findByProps({ testID: 'salvar-3' }).props.accessibilityState
        .selected,
    ).toBe(true);
    // após salvar: estado selected = true
    expect(
      r.root.findByProps({ testID: 'salvar-3' }).props.accessibilityState
        .selected,
    ).toBe(true);
    act(() => {
      r.root.findByProps({ testID: 'salvar-3' }).props.onPress();
    });
    expect(
      r.root.findByProps({ testID: 'salvar-3' }).props.accessibilityState
        .selected,
    ).toBe(false);
  });

  describe('editar/apagar review própria', () => {
    it('com onEdit: botão "editar" dispara o callback', () => {
      const onEdit = vi.fn();
      const { r } = render({ onEdit });
      act(() => {
        r.root.findByProps({ testID: 'editar-3' }).props.onPress();
      });
      expect(onEdit).toHaveBeenCalled();
    });

    it('com onDelete: botão "apagar" dispara o callback', () => {
      const onDelete = vi.fn();
      const { r } = render({ onDelete });
      act(() => {
        r.root.findByProps({ testID: 'apagar-3' }).props.onPress();
      });
      expect(onDelete).toHaveBeenCalled();
    });

    it('sem onEdit/onDelete: nenhum botão de dono aparece', () => {
      const { r } = render();
      expect(r.root.findAllByProps({ testID: 'editar-3' })).toHaveLength(0);
      expect(r.root.findAllByProps({ testID: 'apagar-3' })).toHaveLength(0);
    });
  });
});
