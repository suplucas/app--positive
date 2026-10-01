import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { RestaurantScreen } from './RestaurantScreen';
import { restaurantFor } from './restaurantMock';
import { restaurantNames } from './restaurantNames';

const [cnpjExemplo] = Object.entries(restaurantNames)[0];
const data = restaurantFor(cnpjExemplo);

function render(props: Partial<Parameters<typeof RestaurantScreen>[0]> = {}) {
  const r = create(
    createElement(RestaurantScreen, {
      cnpj: cnpjExemplo,
      onBack: vi.fn(),
      onEvaluate: vi.fn(),
      ...props,
    }),
  );
  return r as ReactTestRenderer;
}

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

  it('quero ir alterna para salvo', () => {
    const r = render();
    expect(byID(r, 'quero-ir').props.accessibilityState.selected).toBe(false);
    act(() => byID(r, 'quero-ir').props.onPress());
    expect(byID(r, 'quero-ir').props.accessibilityState.selected).toBe(true);
    expect(JSON.stringify(r.toJSON())).toContain('salvo');
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
});
