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

// Preenche busca → seleciona o resultado → marca a nota.
function fill(r: ReactTestRenderer, rating: number) {
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

describe('ComposeScreen', () => {
  it('renderiza campos e ação publicar', () => {
    const r = renderCompose();
    const text = JSON.stringify(r.toJSON());
    expect(text).toContain('restaurante');
    expect(text).toContain('nota');
    expect(text).toContain('comentário');
    expect(text).toContain('publicar');
  });

  it('publicar começa desabilitado (sem restaurante e nota)', () => {
    const r = renderCompose();
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

  it('erro de rede mostra mensagem e mantém na tela', async () => {
    postReviewMock.mockRejectedValue(new Error('POST /reviews failed: 500'));
    const onPosted = vi.fn();
    const r = renderCompose({ onPosted });

    fill(r, 3);
    await act(async () => {
      r.root.findByProps({ testID: 'publicar' }).props.onPress();
    });

    expect(onPosted).not.toHaveBeenCalled();
    expect(JSON.stringify(r.toJSON())).toContain('500');
    // volta a habilitar pra nova tentativa
    expect(
      r.root.findByProps({ testID: 'publicar' }).props.accessibilityState
        .disabled,
    ).toBe(false);
  });

  it('cancelar chama onCancel', () => {
    const onCancel = vi.fn();
    const r = renderCompose({ onCancel });
    act(() => {
      r.root.findByProps({ testID: 'cancelar' }).props.onPress();
    });
    expect(onCancel).toHaveBeenCalled();
  });
});
