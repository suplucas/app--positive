import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { ComposeV2 } from './ComposeV2';
import { postReview } from './api';
import { restaurantNames } from './restaurantNames';
import type { Review } from './types';

vi.mock('./api', () => ({
  postReview: vi.fn(),
}));

const postReviewMock = vi.mocked(postReview);

// Usa um restaurante real do mapa do seed.
const [cnpjExemplo, nomeExemplo] = Object.entries(restaurantNames)[0];
const [cnpjOutro] = Object.entries(restaurantNames)[3];
const reviewCreated: Review = {
  id: 1,
  userId: 'user_1',
  restaurantCnpj: cnpjExemplo,
  rating: 4,
  comment: null,
  likes: 0,
  createdAt: '2026-09-24T00:00:00.000Z',
};

type ComposeV2Props = Parameters<typeof ComposeV2>[0];

function render(props: Partial<ComposeV2Props> = {}) {
  const renderer = create(
    createElement(ComposeV2, {
      userId: 'user_1',
      onCancel: vi.fn(),
      onPosted: vi.fn(),
      ...props,
    }),
  );
  return renderer as ReactTestRenderer;
}

function byID(r: ReactTestRenderer, id: string) {
  return r.root.findByProps({ testID: id });
}

// Busca → seleciona o 1º resultado.
function pick(r: ReactTestRenderer, cnpj: string = cnpjExemplo) {
  const nome = restaurantNames[cnpj];
  act(() => {
    byID(r, 'buscar-v2').props.onChangeText(nome!.toLowerCase().slice(0, 6));
  });
  act(() => {
    byID(r, `pick-v2-${cnpj}`).props.onPress();
  });
}

describe('ComposeV2 (cabeçalho, docs/16)', () => {
  it('cabeçalho "nova avaliação" com cancelar e tim!', () => {
    const r = render();
    expect(JSON.stringify(r.toJSON())).toContain('nova avaliação');
    expect(r.root.findAllByProps({ testID: 'cancelar-v2' })).toHaveLength(1);
    expect(r.root.findAllByProps({ testID: 'publicar-v2' })).toHaveLength(1);
    // botão tim! desabilitado sem restaurante selecionado
    expect(
      r.root.findByProps({ testID: 'publicar-v2' }).props.accessibilityState
        .disabled,
    ).toBe(true);
  });
});

describe('ComposeV2 (trocar via busca, docs/16)', () => {
  it('"trocar" chama onChangePlace (abre o picker) quando disponível', () => {
    const onChangePlace = vi.fn();
    const r = render({ onChangePlace });
    pick(r);
    act(() => byID(r, 'trocar-restaurante').props.onPress());
    expect(onChangePlace).toHaveBeenCalled();
  });

  it('pickedCnpj (resultado do picker) preenche o local', () => {
    const r = render({ pickedCnpj: cnpjOutro });
    const texto = JSON.stringify(r.toJSON());
    expect(texto).toContain(restaurantNames[cnpjOutro]);
    expect(r.root.findAllByProps({ testID: 'trocar-restaurante' })).toHaveLength(1);
  });
});

describe('ComposeV2 (várias fotos, docs/15)', () => {
  it('adiciona até 4 fotos: miniaturas na fila, preview na 1ª', async () => {
    let n = 0;
    const r = render({
      onPickPhoto: async () => ({ uri: `file://f${n++}.jpg` }),
    });
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        byID(r, 'foto-add').props.onPress();
      });
    }
    expect(r.root.findAllByProps({ testID: 'foto-thumb-0' })).toHaveLength(1);
    expect(r.root.findAllByProps({ testID: 'foto-thumb-2' })).toHaveLength(1);
    expect(byID(r, 'foto-preview').props.source).toEqual({
      uri: 'file://f0.jpg',
    });
  });

  it('remover a 1ª foto: as demais sobem, preview vira a próxima', async () => {
    let n = 0;
    const r = render({
      onPickPhoto: async () => ({ uri: `file://f${n++}.jpg` }),
    });
    await act(async () => byID(r, 'foto-add').props.onPress());
    await act(async () => byID(r, 'foto-add').props.onPress());
    act(() => {
      byID(r, 'foto-tirar-0').props.onPress();
    });
    expect(r.root.findAllByProps({ testID: 'foto-thumb-0' })).toHaveLength(1);
    expect(byID(r, 'foto-preview').props.source).toEqual({
      uri: 'file://f1.jpg',
    });
  });

  it('teto de 4: botão de adicionar some', async () => {
    let n = 0;
    const r = render({
      onPickPhoto: async () => ({ uri: `file://g${n++}.jpg` }),
    });
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        byID(r, 'foto-add').props.onPress();
      });
    }
    expect(r.root.findAllByProps({ testID: 'foto-add' })).toHaveLength(0);
    expect(r.root.findAllByProps({ testID: 'foto-thumb-3' })).toHaveLength(1);
  });

  it('cancelar o picker não altera a fila', async () => {
    const r = render({ onPickPhoto: async () => null });
    await act(async () => {
      byID(r, 'foto-add').props.onPress();
    });
    expect(r.root.findAllByProps({ testID: 'foto-thumb-0' })).toHaveLength(0);
  });
});

describe('ComposeV2 (foto real, docs/13)', () => {
  it('picker escolhido: preview usa a URI real do device', async () => {
    const r = render({
      onPickPhoto: async () => ({ uri: 'file://demo/foto.jpg' }),
    });
    await act(async () => {
      byID(r, 'foto-add').props.onPress();
    });
    expect(byID(r, 'foto-preview').props.source).toEqual({
      uri: 'file://demo/foto.jpg',
    });
  });

  it('picker cancelado: segue sem foto (estado intacto)', async () => {
    const r = render({ onPickPhoto: async () => null });
    await act(async () => {
      byID(r, 'foto-add').props.onPress();
    });
    expect(r.root.findAllByProps({ testID: 'foto-preview' })).toHaveLength(0);
  });

  it('estado com foto deixa claro que ela não vai para a API', async () => {
    const r = render({
      onPickPhoto: async () => ({ uri: 'file://demo/foto.jpg' }),
    });
    await act(async () => {
      byID(r, 'foto-add').props.onPress();
    });
    expect(JSON.stringify(r.toJSON())).toContain('local');
  });
});

// Texts de um subtree (instâncias não expõem toJSON nesta versão do
// react-test-renderer; só a raiz).
function subtreeTexts(r: ReactTestRenderer, testID: string): string {
  const inst = r.root.findByProps({ testID });
  return inst
    .findAll((n) => String(n.type) === 'Text')
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    )
    .join(' ');
}

function selectedFlairs(r: ReactTestRenderer): string[] {
  return r.root
    .findAll(
      (n) =>
        typeof n.props.testID === 'string' &&
        n.props.testID.startsWith('flair-') &&
        n.props.accessibilityState?.selected === true,
    )
    .map((n) => n.props.testID!);
}

beforeEach(() => {
  postReviewMock.mockReset();
  postReviewMock.mockResolvedValue(reviewCreated);
});

describe('ComposeV2', () => {
  it('renderiza as seções do docs_04', () => {
    const text = JSON.stringify(render().toJSON());
    expect(text).toContain('onde você comeu');
    expect(text).toContain('nota');
    expect(text).toContain('foto (opcional)');
    expect(text).toContain('o que achou?');
    expect(text).toContain('flair (até 2)');
    expect(text).toContain('preview');
  });

  it('publicar começa desabilitado sem restaurante', () => {
    const r = render();
    expect(byID(r, 'publicar-v2').props.accessibilityState.disabled).toBe(true);
  });

  it('seleciona restaurante e publica com nota padrão 8.0 → rating 4', async () => {
    const onPosted = vi.fn();
    const r = render({ onPosted });
    pick(r);

    expect(byID(r, 'publicar-v2').props.accessibilityState.disabled).toBe(false);
    await act(async () => {
      byID(r, 'publicar-v2').props.onPress();
    });
    expect(postReviewMock).toHaveBeenCalledWith('user_1', {
      restaurantCnpj: cnpjExemplo,
      rating: 4,
      comment: null,
    });
    expect(onPosted).toHaveBeenCalled();
  });

  it('nota no slider vira rating float na API (9.5 → 4.75)', async () => {
    const onPosted = vi.fn();
    const r = render({ onPosted });
    pick(r);
    act(() => {
      byID(r, 'nota-tick-9.5').props.onPress();
    });
    await act(async () => {
      byID(r, 'publicar-v2').props.onPress();
    });
    expect(postReviewMock).toHaveBeenCalledWith('user_1', {
      restaurantCnpj: cnpjExemplo,
      rating: 4.75,
      comment: null,
    });
  });

  it('preview acompanha nota e legenda', () => {
    const r = render();
    pick(r);
    expect(subtreeTexts(r, 'preview-v2')).toContain('8.0');
    act(() => {
      byID(r, 'nota-tick-6.5').props.onPress();
    });
    expect(subtreeTexts(r, 'preview-v2')).toContain('6.5');
    act(() => {
      byID(r, 'legenda').props.onChangeText('fila longa, mas valeu');
    });
    expect(subtreeTexts(r, 'preview-v2')).toContain('fila longa, mas valeu');
  });

  it('limpa o primeiro flair ao escolher o terceiro', () => {
    const r = render();
    act(() => byID(r, 'flair-volto-sim').props.onPress());
    act(() => byID(r, 'flair-prato-pequeno').props.onPress());
    act(() => byID(r, 'flair-achado').props.onPress());
    expect(selectedFlairs(r)).toEqual([
      'flair-prato-pequeno',
      'flair-achado',
    ]);
  });

  it('flair selecionado desmarca ao tocar de novo', () => {
    const r = render();
    act(() => byID(r, 'flair-volto-sim').props.onPress());
    act(() => byID(r, 'flair-volto-sim').props.onPress());
    expect(selectedFlairs(r)).toEqual([]);
  });

  it('foto é local: alterna no estado mas não entra no POST', async () => {
    const onPosted = vi.fn();
    const r = render({
      onPosted,
      onPickPhoto: async () => ({ uri: 'file://demo/foto.jpg' }),
    });
    pick(r);
    await act(async () => byID(r, 'foto-add').props.onPress());
    expect(r.root.findAllByProps({ testID: 'foto-preview' })).toHaveLength(1);
    await act(async () => {
      byID(r, 'publicar-v2').props.onPress();
    });
    const [userId, payload] = postReviewMock.mock.calls[0];
    expect(userId).toBe('user_1');
    expect(payload).toEqual({
      restaurantCnpj: cnpjExemplo,
      rating: 4,
      comment: null,
    });
  });

  it('erro de rede mostra mensagem e mantém na tela', async () => {
    postReviewMock.mockRejectedValue(new Error('POST /reviews failed: 500'));
    const onPosted = vi.fn();
    const r = render({ onPosted });
    pick(r);
    await act(async () => {
      byID(r, 'publicar-v2').props.onPress();
    });
    expect(onPosted).not.toHaveBeenCalled();
    // copy de produto, não o erro técnico da API
    expect(JSON.stringify(r.toJSON())).toContain(
      'Não consegui publicar sua avaliação.',
    );
    expect(
      byID(r, 'publicar-v2').props.accessibilityState.disabled,
    ).toBe(false);
  });

  it('cancelar chama onCancel', () => {
    const onCancel = vi.fn();
    const r = render({ onCancel });
    act(() => byID(r, 'cancelar-v2').props.onPress());
    expect(onCancel).toHaveBeenCalled();
  });

  it('initialCnpj pré-seleciona o restaurante', () => {
    const r = render({ initialCnpj: cnpjOutro });
    // campo de busca não existe com local selecionado
    expect(r.root.findAllByProps({ testID: 'buscar-v2' })).toHaveLength(0);
    expect(JSON.stringify(r.toJSON())).toContain(restaurantNames[cnpjOutro]);
    expect(
      byID(r, 'publicar-v2').props.accessibilityState.disabled,
    ).toBe(false);
  });
});
