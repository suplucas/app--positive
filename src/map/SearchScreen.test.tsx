import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { SearchScreen } from './SearchScreen';
import { searchGlobal } from '../api/search';

vi.mock('../api/search', () => ({
  searchGlobal: vi.fn(),
}));

const lugar = {
  id: '33229301000140',
  source: 'local' as const,
  nome: 'Kyoto sushi bar',
  endereco: 'Rua A',
  categoria: 'japonesa',
  lat: -23.5,
  lng: -46.6,
  nota: 9.1,
  bairro: 'Pinheiros',
};
const review = {
  id: 'rev_1',
  userId: 'u1',
  restaurantId: '33229301000140',
  rating: 4.5,
  comment: 'Massa maravilhosa',
  likes: 12,
  createdAt: '2026-09-24T00:00:00.000Z',
};
const usuario = {
  id: 'u2',
  name: 'Mogli',
  username: 'mogli',
  bio: 'comendo por aí',
  isFollowing: false,
  stats: { reviews: 3, followers: 10, following: 5, notaMedia: 8.5 },
};

async function render(
  props: Partial<Parameters<typeof SearchScreen>[0]> = {},
) {
  const onOpenRestaurant = props.onOpenRestaurant ?? vi.fn();
  const onOpenReview = props.onOpenReview ?? vi.fn();
  const onOpenProfile = props.onOpenProfile ?? vi.fn();
  const r = create(
    createElement(SearchScreen, {
      onOpenRestaurant,
      onOpenReview,
      onOpenProfile,
      ...props,
    }),
  ) as ReactTestRenderer;
  return { r, onOpenRestaurant, onOpenReview, onOpenProfile };
}

function input(r: ReactTestRenderer, value: string) {
  act(() => {
    r.root.findByProps({ testID: 'busca-input' }).props.onChangeText(value);
  });
}

function byID(r: ReactTestRenderer, id: string) {
  return r.root.findByProps({ testID: id });
}

function allText(r: ReactTestRenderer): string {
  return r.root
    .findAll((n) => String(n.type) === 'Text')
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    )
    .join(' ');
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(searchGlobal).mockReset();
  vi.mocked(searchGlobal).mockResolvedValue({
    places: [lugar],
    reviews: [review],
    users: [usuario],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function flush() {
  return act(async () => {
    vi.advanceTimersByTime(300);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('SearchScreen (busca global: lugares, avaliações, pessoas)', () => {
  it('query curta pede ao menos 2 letras', async () => {
    const { r } = await render();
    expect(allText(r)).toContain('ao menos 2 letras');
    expect(searchGlobal).not.toHaveBeenCalled();
  });

  it('busca textual chama a API e mostra todas as seções', async () => {
    const { r } = await render();
    input(r, 'kyoto');
    await flush();
    expect(searchGlobal).toHaveBeenCalledWith('kyoto');
    expect(allText(r)).toContain('Kyoto sushi bar');
    expect(allText(r)).toContain('Massa maravilhosa');
    expect(allText(r)).toContain('Mogli');
  });

  it('mostra seções: Lugares, Avaliações, Pessoas', async () => {
    const { r } = await render();
    input(r, 'kyoto');
    await flush();
    expect(allText(r)).toContain('Lugares');
    expect(allText(r)).toContain('Avaliações');
    expect(allText(r)).toContain('Pessoas');
  });

  it('resultado lugar abre a página do restaurante', async () => {
    const { r, onOpenRestaurant } = await render();
    input(r, 'kyoto');
    await flush();
    act(() => {
      r.root.findByProps({ testID: `busca-lugar-${lugar.id}` }).props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith(lugar.id);
  });

  it('resultado avaliação chama onOpenReview', async () => {
    const { r, onOpenReview } = await render();
    input(r, 'kyoto');
    await flush();
    act(() => {
      r.root.findByProps({ testID: `busca-review-${review.id}` }).props.onPress();
    });
    expect(onOpenReview).toHaveBeenCalledWith(review.id);
  });

  it('resultado pessoa chama onOpenProfile', async () => {
    const { r, onOpenProfile } = await render();
    input(r, 'kyoto');
    await flush();
    act(() => {
      r.root.findByProps({ testID: `busca-pessoa-${usuario.id}` }).props.onPress();
    });
    expect(onOpenProfile).toHaveBeenCalledWith(usuario.id);
  });

  it('modo picker só busca lugares locais e chama onPick', async () => {
    vi.mocked(searchGlobal).mockResolvedValue({
      places: [lugar],
      reviews: [],
      users: [],
    });
    const onPick = vi.fn();
    const { r } = await render({ placesOnly: true, onPick });
    input(r, 'pizza');
    await flush();
    expect(
      r.root.findAllByProps({ testID: `busca-lugar-${lugar.id}` }),
    ).toHaveLength(1);
    act(() => {
      r.root.findByProps({ testID: `busca-lugar-${lugar.id}` }).props.onPress();
    });
    expect(onPick).toHaveBeenCalledWith({
      cnpj: lugar.id,
      nome: lugar.nome,
    });
  });

  it('sem resultados mostra copy amigável', async () => {
    vi.mocked(searchGlobal).mockResolvedValue({
      places: [],
      reviews: [],
      users: [],
    });
    const { r } = await render();
    input(r, 'zzz');
    await flush();
    expect(allText(r)).toContain('Não encontramos');
  });

  it('com onBack: botão voltar', async () => {
    const onBack = vi.fn();
    const { r } = await render({ onBack });
    act(() => {
      r.root.findByProps({ testID: 'busca-voltar' }).props.onPress();
    });
    expect(onBack).toHaveBeenCalled();
  });

  it('erro de busca com onBack: mostra botão voltar', async () => {
    vi.mocked(searchGlobal).mockRejectedValue(new Error('offline'));
    const onBack = vi.fn();
    const { r } = await render({ onBack });
    input(r, 'kyoto');
    await flush();
    expect(byID(r, 'busca-voltar-erro')).toBeTruthy();
    act(() => byID(r, 'busca-voltar-erro').props.onPress());
    expect(onBack).toHaveBeenCalled();
  });
});
