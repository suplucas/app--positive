import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { ComposeScreen } from './ComposeScreen';
import { postReview } from './api';
import { restaurantNames } from './restaurantNames';
import type { Review } from './types';

vi.mock('./api', () => ({
  postReview: vi.fn(),
}));

const postReviewMock = vi.mocked(postReview);

// Usa um restaurante real do mapa do seed.
const [cnpjExemplo, nomeExemplo] = Object.entries(restaurantNames)[0];
const [cnpjInicial] = Object.entries(restaurantNames)[5];
const reviewCreated: Review = {
  id: 1,
  userId: 'user_1',
  restaurantCnpj: cnpjExemplo,
  rating: 4,
  comment: null,
  likes: 0,
  createdAt: '2026-09-24T00:00:00.000Z',
};

type ComposeProps = Parameters<typeof ComposeScreen>[0];

function renderCompose(props: Partial<ComposeProps> = {}) {
  const renderer = create(
    createElement(ComposeScreen, {
      userId: 'user_1',
      onCancel: vi.fn(),
      onPosted: vi.fn(),
      ...props,
    }),
  );
  return renderer as ReactTestRenderer;
}

function toV1(r: ReactTestRenderer) {
  act(() => {
    r.root.findByProps({ testID: 'avaliar-v1' }).props.onPress();
  });
}

// Preenche busca → seleciona o resultado → marca a nota (em v1).
function fill(r: ReactTestRenderer, rating: number) {
  toV1(r);
  act(() => {
    r.root.findByProps({ testID: 'busca' }).props.onChangeText(
      nomeExemplo.toLowerCase(),
    );
  });
  act(() => {
    r.root.findByProps({ testID: `pick-${cnpjExemplo}` }).props.onPress();
  });
  act(() => {
    r.root.findByProps({ testID: `nota-${rating}` }).props.onPress();
  });
}

beforeEach(() => {
  postReviewMock.mockReset();
  postReviewMock.mockResolvedValue(reviewCreated);
});

describe('ComposeScreen (seletor de versão)', () => {
  it('renderiza v2 por padrão (docs_04)', () => {
    const text = JSON.stringify(renderCompose().toJSON());
    expect(text).toContain('avaliar v1');
    expect(text).toContain('avaliar v2');
    // conteúdo da v2 presente, da v1 ausente
    expect(text).toContain('flair (até 2)');
    expect(renderCompose().root.findAllByProps({ testID: 'busca' })).toHaveLength(0);
  });

  it('alterna para v1 no chip', () => {
    const r = renderCompose();
    toV1(r);
    expect(r.root.findAllByProps({ testID: 'busca' })).toHaveLength(1);
    expect(JSON.stringify(r.toJSON())).toContain('comentário');
  });
});

describe('ComposeScreen v1', () => {
  it('renderiza campos e ação publicar', () => {
    const r = renderCompose();
    toV1(r);
    const text = JSON.stringify(r.toJSON());
    expect(text).toContain('restaurante');
    expect(text).toContain('nota');
    expect(text).toContain('comentário');
    expect(text).toContain('publicar');
  });

  it('publicar começa desabilitado (sem restaurante e nota)', () => {
    const r = renderCompose();
    toV1(r);
    const btn = r.root.findByProps({ testID: 'publicar' });
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('busca filtra, seleciona, nota marcada → publicar habilita e envia', async () => {
    const onPosted = vi.fn();
    const r = renderCompose({ onPosted });

    fill(r, 4);

    expect(JSON.stringify(r.toJSON())).toContain(nomeExemplo);
    const btn = r.root.findByProps({ testID: 'publicar' });
    expect(btn.props.accessibilityState.disabled).toBe(false);

    await act(async () => {
      btn.props.onPress();
    });

    expect(postReviewMock).toHaveBeenCalledWith('user_1', {
      restaurantCnpj: cnpjExemplo,
      rating: 4,
      comment: null,
    });
    expect(onPosted).toHaveBeenCalled();
  });

  it('inicialCnpj pré-seleciona o restaurante em v1', () => {
    const r = renderCompose({ initialCnpj: cnpjInicial });
    toV1(r);
    expect(r.root.findAllByProps({ testID: 'busca' })).toHaveLength(0);
    expect(JSON.stringify(r.toJSON())).toContain(restaurantNames[cnpjInicial]);
  });

  it('erro de rede mostra mensagem e mantém na tela', async () => {
    postReviewMock.mockRejectedValue(new Error('POST /reviews failed: 500'));
    const onPosted = vi.fn();
    const r = renderCompose({ onPosted });

    fill(r, 3);
    await act(async () => {
      r.root.findByProps({ testID: 'publicar' }).props.onPress();
    });

    expect(onPosted).not.toHaveBeenCalled();
    // copy de produto, não o erro técnico da API
    expect(JSON.stringify(r.toJSON())).toContain(
      'Não consegui publicar sua avaliação.',
    );
    // volta a habilitar pra nova tentativa
    expect(
      r.root.findByProps({ testID: 'publicar' }).props.accessibilityState
        .disabled,
    ).toBe(false);
  });

  it('cancelar chama onCancel', () => {
    const onCancel = vi.fn();
    const r = renderCompose({ onCancel });
    toV1(r);
    act(() => {
      r.root.findByProps({ testID: 'cancelar' }).props.onPress();
    });
    expect(onCancel).toHaveBeenCalled();
  });
});
