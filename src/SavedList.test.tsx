import { describe, it, expect, vi } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { SavedList } from './SavedList';

const CJNPJ_1 = '09597505000150'; // BAR DO LECO
const CJNPJ_2 = '33229301000140'; // Kyoto sushi bar

function render(props: Partial<Parameters<typeof SavedList>[0]> = {}) {
  const r = create(
    createElement(SavedList, {
      cnpjs: [CJNPJ_1, CJNPJ_2],
      onRemove: vi.fn(),
      onOpenRestaurant: vi.fn(),
      ...props,
    }),
  );
  return r as ReactTestRenderer;
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

describe('SavedList (docs/16, lista "quero ir")', () => {
  it('lista cada CNPJ salvo com nome e meta', () => {
    const r = render();
    expect(r.root.findByProps({ testID: `salvo-linha-${CJNPJ_1}` })).toBeTruthy();
    expect(r.root.findByProps({ testID: `salvo-linha-${CJNPJ_2}` })).toBeTruthy();
    const text = allText(r);
    expect(text).toContain('BAR DO LECO');
    expect(text).toContain('Kyoto sushi bar');
    expect(text).toContain('km');
  });

  it('toque na linha abre o restaurante', () => {
    const onOpenRestaurant = vi.fn();
    const r = render({ onOpenRestaurant });
    act(() => {
      r.root.findByProps({ testID: `salvo-linha-${CJNPJ_1}` }).props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith(CJNPJ_1);
  });

  it('botão ★ remove', () => {
    const onRemove = vi.fn();
    const r = render({ onRemove });
    act(() => {
      r.root.findByProps({ testID: `salvo-tirar-${CJNPJ_2}` }).props.onPress();
    });
    expect(onRemove).toHaveBeenCalledWith(CJNPJ_2);
  });

  it('vazio: copy explicando como salvar', () => {
    const r = render({ cnpjs: [] });
    expect(r.root.findByProps({ testID: 'salvo-vazio' })).toBeTruthy();
    expect(allText(r)).toContain('ainda não salvou nenhum restaurante');
  });
});
