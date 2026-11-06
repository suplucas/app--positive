import { describe, it, expect } from 'vitest';
import { buildMapHtml, buildPinData, jsonForScript } from './mapHtml';
import { mapPlaces } from './mapMock';

describe('buildPinData (pins do mapa)', () => {
  const places = mapPlaces();

  it('gera um pin por lugar, com cnpj e nota', () => {
    const pins = buildPinData(places);
    expect(pins).toHaveLength(places.length);
    for (const p of places) {
      const pin = pins.find((x) => x.cnpj === p.cnpj);
      expect(pin).toBeDefined();
      if (p.nota != null) expect(pin!.html).toContain(p.nota.toFixed(1));
    }
  });

  it('nota null vira pin de descoberta (sem número)', () => {
    const discovery = {
      ...places[0]!,
      cnpj: 'osm:node/9',
      nome: 'Café Novo',
      nota: null,
    };
    const pins = buildPinData([discovery]);
    expect(pins[0]!.desc).toBe(true);
    expect(pins[0]!.html).toContain('pin-desc');
    expect(pins[0]!.html).not.toContain('class="pin"');
    expect(pins[0]!.cnpj).toBe('osm:node/9');
  });

  it('social mantém o pin com número', () => {
    const social = { ...places[0]!, cnpj: 'seed-1', nota: 9.5 };
    const pins = buildPinData([social]);
    expect(pins[0]!.desc).toBe(false);
    expect(pins[0]!.html).toContain('class="pin"');
    expect(pins[0]!.html).toContain('9.5');
  });

  it('escapa os dados para injeção segura de script', () => {
    const payload = '</script><script>alert(1)</script>';
    const js = jsonForScript([{ cnpj: payload, nome: payload }]);
    expect(js).not.toContain('</script>');
    expect(js).toContain('\\u003c/script');
  });
});

describe('buildMapHtml (mapa OSM/Leaflet)', () => {
  it('emite bounds no moveend', () => {
    const html = buildMapHtml({ mode: 'light' });
    expect(html).toContain("on('moveend'");
    expect(html).toContain("'bounds'");
  });

  it('sem key cai no OSM padrão (dev) com atribuição', () => {
    const html = buildMapHtml({ mode: 'light' });
    expect(html).toContain('tile.openstreetmap.org');
    expect(html).toContain('OpenStreetMap');
    expect(html).not.toContain('api.maptiler.com');
  });

  it('com key usa MapTiler e credita OSM + MapTiler', () => {
    const html = buildMapHtml({ mode: 'light', tileKey: 'chave-teste' });
    expect(html).toContain('api.maptiler.com/maps/backdrop-v4/256/');
    expect(html).toContain('key=chave-teste');
    expect(html).toContain('OpenStreetMap');
    expect(html).toContain('MapTiler');
  });

  it('ponte: toque no pin envia postMessage ao React Native', () => {
    const html = buildMapHtml({ mode: 'light' });
    expect(html).toContain('ReactNativeWebView.postMessage');
    expect(html).toContain('open-restaurant');
  });

  it('mostra o ponto "você"', () => {
    const html = buildMapHtml({ mode: 'light' });
    expect(html).toContain('voce');
  });

  it('tema escuro usa a variante dark do MapTiler', () => {
    const light = buildMapHtml({ mode: 'light', tileKey: 'k' });
    const dark = buildMapHtml({ mode: 'dark', tileKey: 'k' });
    expect(light).toContain('backdrop-v4/256');
    expect(dark).toContain('backdrop-v4-dark/256');
    expect(light).not.toBe(dark);
  });

  it('não embute os lugares ao vivo: pins chegam por setPins/fitToBounds', () => {
    const places = mapPlaces();
    const html = buildMapHtml({ mode: 'light' });
    for (const p of places) expect(html).not.toContain(p.cnpj);
    // Sem a lista embutida, o WebView não recarrega a cada resposta.
    expect(html).toContain('window.setPins');
    expect(html).toContain('window.fitToBounds');
  });
});
