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
    source: 'local',
  },
  {
    id: '2',
    nome: 'Bar Y',
    lat: -23.56,
    lng: -46.64,
    nota: 7.5,
    bairro: 'Moema',
    source: 'local',
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

  it('bounds do mapa refazem o GET com a bbox, após o debounce', async () => {
    vi.useFakeTimers();
    try {
      const { r } = await render();
      vi.mocked(getPlaces).mockClear();
      const bbox = { minLng: 1, minLat: 2, maxLng: 3, maxLat: 4 };
      receive(r, JSON.stringify({ type: 'bounds', bbox }));
      expect(getPlaces).not.toHaveBeenCalled();
      await act(async () => {
        vi.advanceTimersByTime(699);
      });
      expect(getPlaces).not.toHaveBeenCalled();
      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(getPlaces).toHaveBeenCalledWith(bbox);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignora bounds com bbox inválida', async () => {
    vi.useFakeTimers();
    try {
      const { r } = await render();
      vi.mocked(getPlaces).mockClear();
      receive(
        r,
        JSON.stringify({ type: 'bounds', bbox: { minLng: 1, minLat: 2 } }),
      );
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(getPlaces).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('rail social-first: nota != null antes da descoberta', async () => {
    vi.mocked(getPlaces).mockResolvedValue([
      {
        id: 'desc',
        nome: 'Descoberta',
        lat: -23.55,
        lng: -46.63,
        nota: null,
        bairro: null,
        source: 'overpass',
      },
      {
        id: 'social',
        nome: 'Social',
        lat: -23.56,
        lng: -46.64,
        nota: 8,
        bairro: 'Moema',
        source: 'local',
      },
    ]);
    const { r } = await render();
    const ids = r.root
      .findAll(
        (n) =>
          typeof n.props.testID === 'string' &&
          n.props.testID.startsWith('mapa-card-'),
      )
      .map((n) => n.props.testID);
    expect(ids).toEqual(['mapa-card-social', 'mapa-card-desc']);
  });
});
