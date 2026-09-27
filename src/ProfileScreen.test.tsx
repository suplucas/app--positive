import { describe, it, expect } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { ProfileScreen } from './ProfileScreen';
import { MOCK_POST_PHOTOS } from './postPhotos';

function render() {
  const r: ReactTestRenderer = create(createElement(ProfileScreen));
  return { r, text: () => JSON.stringify(r.toJSON()) };
}

function followLabel(r: ReactTestRenderer): string {
  return String(r.root.findByProps({ testID: 'seguir-label' }).props.children);
}

describe('ProfileScreen (v2)', () => {
  it('mostra nome, handle, bio e stats', () => {
    const { text } = render();
    expect(text()).toContain('Bea Ferraz');
    expect(text()).toContain('@bea_come_tudo');
    expect(text()).toContain('184');
    expect(text()).toContain('Crítica de fim de semana');
  });

  it('usa foto real em 1 favorito e 1 célula do diário', () => {
    const { r } = render();
    expect(
      r.root.findAllByProps({ testID: 'diario-foto-4' }).length,
    ).toBeGreaterThan(0);
    expect(
      r.root.findAllByProps({ testID: 'favorito-foto-1' }).length,
    ).toBeGreaterThan(0);
    // diário usa a 1ª foto, favorito usa a 2ª
    expect(
      r.root.findAllByProps({ source: MOCK_POST_PHOTOS[0] }).length,
    ).toBeGreaterThan(0);
    expect(
      r.root.findAllByProps({ source: MOCK_POST_PHOTOS[1] }).length,
    ).toBeGreaterThan(0);
  });

  it('alterna seguir → seguindo ao tocar', () => {
    const { r } = render();
    expect(followLabel(r)).toBe('seguir');
    act(() => {
      r.root.findByProps({ testID: 'seguir' }).props.onPress();
    });
    expect(followLabel(r)).toBe('seguindo');
  });

  it('abre na aba diário e troca para listas', () => {
    const { r, text } = render();
    expect(text()).toContain('Empório Real'); // quote card do diário
    expect(text()).not.toContain('Melhores pizzarias de SP');
    act(() => {
      r.root.findByProps({ testID: 'tab-listas' }).props.onPress();
    });
    expect(text()).toContain('Melhores pizzarias de SP');
    expect(text()).toContain('Levar visita de fora');
    expect(text()).not.toContain('Empório Real');
  });

  it('seletor troca entre perfil v1 e v2', () => {
    const { r } = render();
    // v2 por padrão: botão seguir + aba listas
    expect(r.root.findAllByProps({ testID: 'seguir' }).length).toBeGreaterThan(0);
    expect(
      r.root.findAllByProps({ testID: 'tab-listas' }).length,
    ).toBeGreaterThan(0);
    // v1: some seguir e abas, continua mostrando os blocos
    act(() => {
      r.root.findByProps({ testID: 'perfil-v1' }).props.onPress();
    });
    expect(r.root.findAllByProps({ testID: 'seguir' }).length).toBe(0);
    expect(r.root.findAllByProps({ testID: 'tab-listas' }).length).toBe(0);
    expect(r.root.findAllByProps({ testID: 'favorito-foto-1' }).length).toBeGreaterThan(0);
    // volta para v2
    act(() => {
      r.root.findByProps({ testID: 'perfil-v2' }).props.onPress();
    });
    expect(r.root.findAllByProps({ testID: 'seguir' }).length).toBeGreaterThan(0);
  });
});
