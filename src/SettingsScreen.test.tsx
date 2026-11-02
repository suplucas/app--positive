import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { SettingsScreen } from './SettingsScreen';

type ThemeMode = Parameters<typeof SettingsScreen>[0]['themeMode'];

function render(props: Partial<Parameters<typeof SettingsScreen>[0]> = {}) {
  const r = create(
    createElement(SettingsScreen, {
      themeMode: 'system' as ThemeMode,
      onThemeChange: vi.fn(),
      onBack: vi.fn(),
      ...props,
    }),
  );
  return r as ReactTestRenderer;
}

function byID(r: ReactTestRenderer, id: string) {
  return r.root.findByProps({ testID: id });
}

describe('SettingsScreen', () => {
  it('renderiza as 3 opções de tema', () => {
    const text = JSON.stringify(render().toJSON());
    expect(text).toContain('sistema');
    expect(text).toContain('claro');
    expect(text).toContain('escuro');
  });

  it('marca o tema ativo e toca em onThemeChange', () => {
    const onThemeChange = vi.fn();
    const r = render({ themeMode: 'dark', onThemeChange });
    expect(byID(r, 'tema-escuro').props.accessibilityState.selected).toBe(true);
    expect(byID(r, 'tema-claro').props.accessibilityState.selected).toBe(false);
    act(() => {
      byID(r, 'tema-sistema').props.onPress();
    });
    expect(onThemeChange).toHaveBeenCalledWith('system');
  });

  it('sair chama onSignOut', () => {
    const onSignOut = vi.fn().mockResolvedValue(undefined);
    const r = render({ onSignOut });
    act(() => {
      byID(r, 'sair').props.onPress();
    });
    expect(onSignOut).toHaveBeenCalled();
  });

  it('voltar chama onBack', () => {
    const onBack = vi.fn();
    const r = render({ onBack });
    act(() => byID(r, 'voltar').props.onPress());
    expect(onBack).toHaveBeenCalled();
  });
});
