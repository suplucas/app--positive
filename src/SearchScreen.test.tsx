import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { SearchScreen } from './SearchScreen';
import { searchPlaces } from './api/place';

vi.mock('./api/place.js', () => ({ searchPlaces: vi.fn() }));

const local = {
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
const osm = {
  id: 'osm:node/1',
  source: 'osm' as const,
  nome: 'Pizza do OSM',
  endereco: 'Rua OSM',
  categoria: 'restaurant',
  lat: -23.55,
  lng: -46.63,
  nota: 8.2,
  bairro: 'Moema',
};

async function render(
  props: Partial<Parameters<typeof SearchScreen>[0]> = {},
) {
  const onOpenRestaurant = props.onOpenRestaurant ?? vi.fn();
  const r = create(
    createElement(SearchScreen, { onOpenRestaurant, ...props }),
  ) as ReactTestRenderer;
  return { r, onOpenRestaurant };
}

function input(r: ReactTestRenderer, value: string) {
  act(() => {
    r.root.findByProps({ testID: 'busca-input' }).props.onChangeText(value);
  });
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
  vi.mocked(searchPlaces).mockReset();
  vi.mocked(searchPlaces).mockResolvedValue([local, osm]);
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

describe('SearchScreen (busca integrada)', () => {
  it('query curta pede ao menos 2 letras', async () => {
    const { r } = await render();
    expect(allText(r)).toContain('ao menos 2 letras');
    expect(searchPlaces).not.toHaveBeenCalled();
  });

  it('busca textual chama a API e mostra os resultados', async () => {
    const { r } = await render();
    input(r, 'kyoto');
    await flush();
    expect(searchPlaces).toHaveBeenCalledWith('kyoto');
    expect(allText(r)).toContain('Kyoto sushi bar');
    expect(allText(r)).toContain('Pizza do OSM');
  });

  it('resultado local abre a página do restaurante', async () => {
    const { r, onOpenRestaurant } = await render();
    input(r, 'kyoto');
    await flush();
    act(() => {
      r.root.findByProps({ testID: `busca-hit-${local.id}` }).props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith(local.id);
  });

  it('resultado OSM usa onOpenPlace quando disponível', async () => {
    const onOpenPlace = vi.fn();
    const { r, onOpenRestaurant } = await render({ onOpenPlace });
    input(r, 'pizza');
    await flush();
    act(() => {
      r.root.findByProps({ testID: `busca-hit-${osm.id}` }).props.onPress();
    });
    expect(onOpenPlace).toHaveBeenCalledWith(osm);
    expect(onOpenRestaurant).not.toHaveBeenCalled();
  });

  it('modo picker ignora resultados OSM', async () => {
    const onPick = vi.fn();
    const { r } = await render({ onPick });
    input(r, 'pizza');
    await flush();
    expect(r.root.findAllByProps({ testID: `busca-hit-${local.id}` })).toHaveLength(1);
    expect(r.root.findAllByProps({ testID: `busca-hit-${osm.id}` })).toHaveLength(0);
    act(() => {
      r.root.findByProps({ testID: `busca-hit-${local.id}` }).props.onPress();
    });
    expect(onPick).toHaveBeenCalledWith({ cnpj: local.id, nome: local.nome });
  });

  it('sem resultados mostra copy amigável', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([]);
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
});
