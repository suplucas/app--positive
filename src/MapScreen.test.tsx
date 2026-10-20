import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { MapScreen } from './MapScreen';
import { getPlaces } from './api/place';

vi.mock('./api/place.js', () => ({ getPlaces: vi.fn() }));

const pins = [
  {
    id: '1',
    nome: 'Pizza X',
    lat: -23.55,
    lng: -46.63,
    nota: 9,
    bairro: 'Pinheiros',
  },
  {
    id: '2',
    nome: 'Bar Y',
    lat: -23.56,
    lng: -46.64,
    nota: 7.5,
    bairro: 'Moema',
  },
];

async function render(props: Partial<Parameters<typeof MapScreen>[0]> = {}) {
  const onOpenRestaurant = props.onOpenRestaurant ?? vi.fn();
  const r = create(
    createElement(MapScreen, { onOpenRestaurant, ...props }),
  ) as ReactTestRenderer;
  await act(async () => {});
  return { r, onOpenRestaurant };
}

function flat(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return (style ?? {}) as Record<string, unknown>;
}

function webview(r: ReactTestRenderer) {
  return r.root.findByProps({ testID: 'mapa-webview' });
}

function html(r: ReactTestRenderer): string {
  return String(webview(r).props.source.html ?? '');
}

function receive(r: ReactTestRenderer, data: string) {
  act(() => {
    webview(r).props.onMessage({ nativeEvent: { data } });
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
  vi.mocked(getPlaces).mockReset();
  vi.mocked(getPlaces).mockResolvedValue(pins);
});

describe('MapScreen (mapa OSM/Leaflet)', () => {
  it('mapa ocupa a tela toda, sem margem', async () => {
    const { r } = await render();
    expect(
      flat(r.root.findByProps({ testID: 'mapa-tela' }).props.style),
    ).toMatchObject({ flex: 1 });
    expect(flat(webview(r).props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    });
  });

  it('HTML recebe os pins da API', async () => {
    const { r } = await render();
    for (const pin of pins) expect(html(r)).toContain(pin.id);
  });

  it('ponte: pin tocado abre a página do restaurante', async () => {
    const { r, onOpenRestaurant } = await render();
    receive(
      r,
      JSON.stringify({ type: 'open-restaurant', cnpj: '1' }),
    );
    expect(onOpenRestaurant).toHaveBeenCalledWith('1');
  });

  it('ignora mensagem inválida ou de outro tipo', async () => {
    const { r, onOpenRestaurant } = await render();
    receive(r, 'não é json');
    receive(r, JSON.stringify({ type: 'outra-coisa' }));
    receive(r, JSON.stringify({ type: 'open-restaurant' }));
    expect(onOpenRestaurant).not.toHaveBeenCalled();
  });

  it('mostra os rótulos "perto de você" e "nessa área"', async () => {
    const { r } = await render();
    expect(allText(r)).toContain('perto de você');
    expect(allText(r)).toContain('nessa área');
  });

  it('bottom sheet: um card por pin e card abre o restaurante', async () => {
    const { r, onOpenRestaurant } = await render();
    for (const pin of pins) {
      expect(
        r.root.findByProps({ testID: `mapa-card-${pin.id}` }),
      ).toBeTruthy();
    }
    act(() => {
      r.root.findByProps({ testID: 'mapa-card-1' }).props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith('1');
  });

  it('não permite que links de atribuição substituam o mapa', async () => {
    const { r } = await render();
    const shouldLoad = webview(r).props.onShouldStartLoadWithRequest;
    expect(shouldLoad({ url: 'about:blank' })).toBe(true);
    expect(
      shouldLoad({ url: 'https://www.openstreetmap.org/copyright' }),
    ).toBe(false);
  });
});
