import { describe, it, expect, vi } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { SearchScreen } from './SearchScreen';
import { searchWithFilter, SEARCH_FILTERS } from './searchFilters';
import { restaurantFor } from './restaurantMock';

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

function tapChip(r: ReactTestRenderer, id: string) {
  act(() => {
    r.root.findByProps({ testID: `busca-chip-${id}` }).props.onPress();
  });
}

describe('SearchScreen (docs/16)', () => {
  it('query vazia: até 8 resultados + os 4 chips de filtro', () => {
    const { r } = render();
    expect(hitCount(r)).toBeLessThanOrEqual(8);
    expect(hitCount(r)).toBeGreaterThan(0);
    for (const f of SEARCH_FILTERS) {
      expect(r.root.findByProps({ testID: `busca-chip-${f.id}` })).toBeTruthy();
    }
    expect(allText(r)).toContain('resultados');
  });

  it('busca textual: "kyoto" encontra o Kyoto sushi bar', () => {
    const { r } = render();
    input(r, 'kyoto');
    expect(hitCount(r)).toBe(1);
    expect(allText(r)).toContain('Kyoto sushi bar');
  });

  it('linha mostra meta (categoria · bairro · preço) e a nota', () => {
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
    expect(rowText).toContain(restaurantFor('33229301000140').notaMedia.toFixed(1));
  });

  it('toque no resultado abre a página do restaurante (modo navegar)', () => {
    const { r, onOpenRestaurant } = render();
    input(r, 'kyoto');
    act(() => {
      r.root
        .findByProps({ testID: 'busca-hit-33229301000140' })
        .props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith('33229301000140');
  });

  it('modo picker: toque chama onPick (não abre a página)', () => {
    const onPick = vi.fn();
    const { r, onOpenRestaurant } = render({ onPick });
    input(r, 'kyoto');
    act(() => {
      r.root
        .findByProps({ testID: 'busca-hit-33229301000140' })
        .props.onPress();
    });
    expect(onPick).toHaveBeenCalledWith({
      cnpj: '33229301000140',
      nome: 'Kyoto sushi bar',
    });
    expect(onOpenRestaurant).not.toHaveBeenCalled();
  });

  it('filtro "mais bem avaliados": 1º mostra a maior nota do resultado', () => {
    const { r } = render();
    tapChip(r, 'avaliados');
    const esperado = searchWithFilter('', 'avaliados')[0]!;
    const row = r.root.findByProps({ testID: `busca-hit-${esperado.cnpj}` });
    const rowText = row
      .findAll((n) => String(n.type) === 'Text')
      .map((n) => String(n.props.children ?? ''))
      .join(' ');
    expect(rowText).toContain(restaurantFor(esperado.cnpj).notaMedia.toFixed(1));
  });

  it('sem resultados: copy amigável e zero linhas', () => {
    const { r } = render();
    input(r, 'zzznotexist');
    expect(hitCount(r)).toBe(0);
    expect(allText(r)).toContain('Não encontramos');
    expect(allText(r)).toContain('zzznotexist');
  });

  it('com onBack: botão voltar', () => {
    const onBack = vi.fn();
    const { r } = render({ onBack });
    act(() => {
      r.root.findByProps({ testID: 'busca-voltar' }).props.onPress();
    });
    expect(onBack).toHaveBeenCalled();
  });
});
