import { describe, it, expect, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { RestaurantProfileTemplate } from './RestaurantProfileTemplate';
import type { RestaurantData } from './restaurantMock';

const data: RestaurantData = {
  cnpj: '12345678000199',
  nome: 'Cantina da Praça',
  categoria: 'massa',
  bairro: 'Pinheiros',
  preco: '$$',
  distanciaKm: 1.2,
  capa: '#8A3550',
  notaMedia: 9.1,
  totalAvaliacoes: 123,
  queroIr: 45,
  flairs: [
    { label: 'volto sim', count: 40 },
    { label: 'achado', count: 12 },
  ],
  seguemAvaliaram: ['ana', 'bia'],
  reviews: [
    {
      id: 'r1',
      userId: 'ana',
      restaurantCnpj: '12345678000199',
      rating: 4.5,
      comment: 'muito bom mesmo',
      likes: 3,
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  ],
};

function render(props: Partial<Parameters<typeof RestaurantProfileTemplate>[0]> = {}) {
  const onBack = props.onBack ?? vi.fn();
  const onEvaluate = props.onEvaluate ?? vi.fn();
  const r = create(
    createElement(RestaurantProfileTemplate, {
      data,
      onBack,
      onEvaluate,
      ...props,
    }),
  ) as ReactTestRenderer;
  return { r, onBack, onEvaluate };
}

function byID(r: ReactTestRenderer, id: string) {
  return r.root.findByProps({ testID: id });
}

describe('RestaurantProfileTemplate (template de apresentação)', () => {
  it('preenche o cabeçalho e os stats com os dados recebidos', () => {
    const { r } = render();
    const text = JSON.stringify(r.toJSON());
    expect(text).toContain(data.nome);
    expect(text).toContain(data.bairro);
    expect(text).toContain(data.categoria);
    expect(text).toContain(data.preco);
    expect(text).toContain(data.notaMedia.toFixed(1));
    expect(text).toContain(String(data.totalAvaliacoes));
    expect(text).toContain(String(data.queroIr));
    expect(text).toContain(data.flairs[0]!.label);
  });

  it('renderiza as reviews recebidas', () => {
    const { r } = render();
    const text = JSON.stringify(r.toJSON());
    expect(text).toContain(data.reviews[0]!.comment!);
    expect(text).toContain(data.reviews[0]!.userId);
    expect(text).toContain((data.reviews[0]!.rating! * 2).toFixed(1));
  });

  it('saved controla o rótulo do botão quero ir', () => {
    const { r } = render({ saved: true });
    expect(JSON.stringify(r.toJSON())).toContain('★ salvo');
    expect(byID(r, 'quero-ir').props.accessibilityState.selected).toBe(true);
  });

  it('encaminha voltar, avaliar e quero ir', () => {
    const onBack = vi.fn();
    const onEvaluate = vi.fn();
    const onSaveToggle = vi.fn();
    const { r } = render({ onBack, onEvaluate, onSaveToggle });
    act(() => byID(r, 'voltar').props.onPress());
    act(() => byID(r, 'avaliar-restaurante').props.onPress());
    act(() => byID(r, 'quero-ir').props.onPress());
    expect(onBack).toHaveBeenCalled();
    expect(onEvaluate).toHaveBeenCalled();
    expect(onSaveToggle).toHaveBeenCalled();
  });
});
