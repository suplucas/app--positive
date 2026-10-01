import { describe, it, expect, vi } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { SearchScreen } from './SearchScreen';

function render(props: Partial<Parameters<typeof SearchScreen>[0]> = {}) {
  const onOpenRestaurant = props.onOpenRestaurant ?? vi.fn();
  const r = create(
    createElement(SearchScreen, { onOpenRestaurant, ...props }),
  );
  return { r: r as ReactTestRenderer, onOpenRestaurant };
}

function hitCount(r: ReactTestRenderer): number {
  return r.root.findAll(
    (n) =>
      typeof n.props.testID === 'string' &&
      n.props.testID.startsWith('busca-hit-'),
  ).length;
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

function input(r: ReactTestRenderer, value: string) {
  act(() => {
    r.root.findByProps({ testID: 'busca-input' }).props.onChangeText(value);
  });
}

describe('SearchScreen (docs/08)', () => {
  it('query vazia mostra 8 sugestões (1ª = início do mapa do seed)', () => {
    const { r } = render();
    expect(hitCount(r)).toBe(8);
    expect(
      r.root.findByProps({ testID: 'busca-hit-60602022000153' }),
    ).toBeTruthy();
    expect(allText(r)).toContain('sugestões');
  });

  it('busca textual: "kyoto" encontra o Kyoto sushi bar', () => {
    const { r } = render();
    input(r, 'kyoto');
    expect(hitCount(r)).toBe(1);
    expect(allText(r)).toContain('Kyoto sushi bar');
    expect(allText(r)).toContain('resultados');
  });

  it('toque no resultado abre a página do restaurante', () => {
    const { r, onOpenRestaurant } = render();
    input(r, 'kyoto');
    act(() => {
      r.root
        .findByProps({ testID: 'busca-hit-33229301000140' })
        .props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith('33229301000140');
  });

  it('sem resultados: copy amigável e zero linhas', () => {
    const { r } = render();
    input(r, 'zzznotexist');
    expect(hitCount(r)).toBe(0);
    expect(allText(r)).toContain('Não encontramos');
    expect(allText(r)).toContain('zzznotexist');
  });

  it('linha de resultado traz meta categoria · bairro · preço · distância', () => {
    const { r } = render();
    input(r, 'kyoto');
    const row = r.root.findByProps({ testID: 'busca-hit-33229301000140' });
    const rowText = row
      .findAll((n) => String(n.type) === 'Text')
      .map((n) =>
        Array.isArray(n.props.children)
          ? n.props.children.join('')
          : String(n.props.children ?? ''),
      )
      .join(' ');
    expect(rowText).toContain('·');
    expect(rowText).toContain('km');
  });
});
