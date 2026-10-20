import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { SettingsScreen } from './SettingsScreen';
import { DEMO_USERS } from './mockFeed';

type ThemeMode = Parameters<typeof SettingsScreen>[0]['themeMode'];

function render(props: Partial<Parameters<typeof SettingsScreen>[0]> = {}) {
  const r = create(
    createElement(SettingsScreen, {
      userId: 'user_1',
      onUserChange: vi.fn(),
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
  it('renderiza todos os usuários de demo e as 3 opções de tema', () => {
    expect(DEMO_USERS).not.toContain('mock');
    const text = JSON.stringify(render().toJSON());
    for (const u of DEMO_USERS) expect(text).toContain(u);
    expect(text).toContain('sistema');
    expect(text).toContain('claro');
    expect(text).toContain('escuro');
  });

  it('marca o usuário ativo com selected', () => {
    const r = render({ userId: 'mogli' });
    expect(byID(r, 'user-mogli').props.accessibilityState.selected).toBe(true);
    expect(byID(r, 'user-user_1').props.accessibilityState.selected).toBe(false);
  });

  it('tocar num usuário chama onUserChange', () => {
    const onUserChange = vi.fn();
    const r = render({ onUserChange });
    act(() => {
      byID(r, 'user-dosso').props.onPress();
    });
    expect(onUserChange).toHaveBeenCalledWith('dosso');
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

  it('voltar chama onBack', () => {
    const onBack = vi.fn();
    const r = render({ onBack });
    act(() => byID(r, 'voltar').props.onPress());
    expect(onBack).toHaveBeenCalled();
  });
});
