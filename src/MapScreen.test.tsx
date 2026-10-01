import { describe, it, expect, vi } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { MapScreen } from './MapScreen';
import { mapPlaces } from './mapMock';

function render(props: Partial<Parameters<typeof MapScreen>[0]> = {}) {
  const onOpenRestaurant = props.onOpenRestaurant ?? vi.fn();
  const r = create(
    createElement(MapScreen, { onOpenRestaurant, ...props }),
  );
  return { r: r as ReactTestRenderer, onOpenRestaurant };
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

describe('MapScreen (docs/16)', () => {
  it('mostra as seções e o ponto "você"', () => {
    const { r } = render();
    const text = allText(r);
    expect(text).toContain('perto de você');
    expect(text).toContain('nessa área');
    expect(r.root.findByProps({ testID: 'mapa-voce' })).toBeTruthy();
  });

  it('renderiza um pin e um card por lugar', () => {
    const { r } = render();
    for (const p of mapPlaces()) {
      expect(r.root.findByProps({ testID: `mapa-pin-${p.cnpj}` })).toBeTruthy();
      expect(r.root.findByProps({ testID: `mapa-card-${p.cnpj}` })).toBeTruthy();
    }
  });

  it('pin mostra a nota e abre a página do restaurante', () => {
    const first = mapPlaces()[0]!;
    const { r, onOpenRestaurant } = render();
    const pin = r.root.findByProps({ testID: `mapa-pin-${first.cnpj}` });
    expect(
      pin
        .findAll((n) => String(n.type) === 'Text')
        .map((n) => String(n.props.children ?? ''))
        .join(' '),
    ).toContain(first.nota.toFixed(1));
    act(() => pin.props.onPress());
    expect(onOpenRestaurant).toHaveBeenCalledWith(first.cnpj);
  });

  it('card "nessa área" abre a página do restaurante', () => {
    const first = mapPlaces()[0]!;
    const { r, onOpenRestaurant } = render();
    act(() => {
      r.root.findByProps({ testID: `mapa-card-${first.cnpj}` }).props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith(first.cnpj);
  });

  it('rodapé declara que é protótipo visual (SDK depois)', () => {
    const { r } = render();
    expect(allText(r).toLowerCase()).toContain('protótipo');
  });
});
