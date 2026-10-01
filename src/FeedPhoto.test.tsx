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
      expect(
        r.root.findAll((n) => String(n.type) === 'Image').length,
      ).toBe(2);
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

    it('v2 + 2 fotos: scrim, linha no topo e nota seguem sobre a foto', () => {
      const { r } = render({ photos: [1, 2], variant: 'v2' });
      expect(r.root.findAllByProps({ testID: 'photo-3-scrim' })).toHaveLength(1);
      const frame = r.root.findByProps({ testID: 'photo-3-frame' });
      expect(textsOf(frame)).toContain('caio.garfo');
      expect(r.root.findByProps({ testID: 'photo-3-note' })).toBeTruthy();
      // carrossel continua funcional no v2
      scrollPage(r, 1);
      expect(JSON.stringify(r.toJSON())).toContain('2/2');
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
