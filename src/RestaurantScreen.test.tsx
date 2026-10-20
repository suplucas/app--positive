import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { RestaurantScreen } from './RestaurantScreen';
import { restaurantFor } from './restaurantMock';
import { restaurantNames } from './restaurantNames';
import { getRestaurant, getRestaurantReviews } from './api/restaurant';

vi.mock('./api/restaurant.js', () => ({
  getRestaurant: vi.fn(),
  getRestaurantReviews: vi.fn(),
}));

const [cnpjExemplo] = Object.entries(restaurantNames)[0];
const data = restaurantFor(cnpjExemplo);

function render(props: Partial<Parameters<typeof RestaurantScreen>[0]> = {}) {
  const r = create(
    createElement(RestaurantScreen, {
      cnpj: cnpjExemplo,
      data,
      onBack: vi.fn(),
      onEvaluate: vi.fn(),
      ...props,
    }),
  );
  return r as ReactTestRenderer;
}

beforeEach(() => {
  vi.mocked(getRestaurant).mockReset();
  vi.mocked(getRestaurantReviews).mockReset();
});

function byID(r: ReactTestRenderer, id: string) {
  return r.root.findByProps({ testID: id });
}

// Texts de um subtree (instâncias não expõem toJSON nesta versão do
// react-test-renderer; só a raiz).
function texts(r: ReactTestRenderer, testID: string): string {
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

describe('RestaurantScreen (docs_05)', () => {
  it('renderiza nome, sub e stats', () => {
    const text = JSON.stringify(render().toJSON());
    expect(text).toContain(data.nome);
    expect(text).toContain(data.bairro);
    expect(text).toContain('nota média');
    expect(text).toContain('avaliações');
    expect(text).toContain('quero ir');
    // nota média na escala 0-10
    expect(text).toContain(data.notaMedia.toFixed(1));
  });

  it('lista reviews com autor, comentário e nota 0-10', () => {
    const r = render();
    const first = data.reviews[0]!;
    const text = JSON.stringify(r.toJSON());
    expect(text).toContain(first.userId);
    expect(text).toContain(first.comment ?? '');
    expect(text).toContain((first.rating! * 2).toFixed(1));
  });

  it('interpola um quote card entre as linhas (componente do feed)', () => {
    const r = render();
    const quote = data.reviews[1]!;
    expect(
      r.root.findAllByProps({ testID: `quote-${quote.id}` }),
    ).toHaveLength(1);
  });

  it('quero ir sem estado salvo: inativo, chama onSaveToggle', () => {
    const onSaveToggle = vi.fn();
    const r = render({ onSaveToggle });
    expect(byID(r, 'quero-ir').props.accessibilityState.selected).toBe(false);
    expect(JSON.stringify(r.toJSON())).toContain('☆ quero ir');
    act(() => byID(r, 'quero-ir').props.onPress());
    expect(onSaveToggle).toHaveBeenCalled();
  });

  it('estado compartilhado: saved=true reflete "★ salvo"', () => {
    const r = render({ saved: true });
    expect(byID(r, 'quero-ir').props.accessibilityState.selected).toBe(true);
    expect(JSON.stringify(r.toJSON())).toContain('★ salvo');
  });

  it('flairs agregados: 1º é forte, resto quieto', () => {
    const r = render();
    expect(
      r.root.findAllByProps({ testID: 'flair-chip-forte' }),
    ).toHaveLength(1);
    expect(texts(r, 'flair-chip-forte')).toContain(data.flairs[0]!.label);
  });

  it('avaliar chama onEvaluate', () => {
    const onEvaluate = vi.fn();
    const r = render({ onEvaluate });
    act(() => byID(r, 'avaliar-restaurante').props.onPress());
    expect(onEvaluate).toHaveBeenCalled();
  });

  it('voltar chama onBack', () => {
    const onBack = vi.fn();
    const r = render({ onBack });
    act(() => byID(r, 'voltar').props.onPress());
    expect(onBack).toHaveBeenCalled();
  });

  it('social proof cita quem você segue que avaliou', () => {
    const text = JSON.stringify(render().toJSON());
    expect(text).toContain('pessoas que você segue já avaliaram aqui');
    expect(text).toContain(data.seguemAvaliaram[0]!);
  });

  it('aceita dados injetados (API/mapa) sem cair no mock', () => {
    const injetado = { ...data, nome: 'Restaurante Injetado', notaMedia: 8.8 };
    const text = JSON.stringify(render({ data: injetado }).toJSON());
    expect(text).toContain('Restaurante Injetado');
    expect(text).toContain('8.8');
  });

  it('sem data injetada, busca perfil + reviews na API', async () => {
    vi.mocked(getRestaurant).mockResolvedValue({
      cnpj: cnpjExemplo,
      nome: 'Restaurante da API',
      categoria: 'massa',
      bairro: null,
      municipio: 'São Paulo',
      preco: null,
      endereco: 'Rua A',
      lat: null,
      lng: null,
      notaMedia: 8.5,
      totalAvaliacoes: 1,
      queroIr: 0,
      flairs: [{ label: 'volto sim', count: 1 }],
      seguemAvaliaram: [],
    });
    vi.mocked(getRestaurantReviews).mockResolvedValue({
      page: 1,
      limit: 20,
      total: 0,
      results: [],
    });

    const r = create(
      createElement(RestaurantScreen, {
        cnpj: cnpjExemplo,
        onBack: vi.fn(),
        onEvaluate: vi.fn(),
      }),
    );
    await act(async () => {});
    expect(JSON.stringify(r.toJSON())).toContain('Restaurante da API');
    expect(getRestaurant).toHaveBeenCalledWith(cnpjExemplo, undefined);
  });
});
