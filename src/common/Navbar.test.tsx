import { describe, it, expect, vi } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { Animated } from 'react-native';
import { Navbar } from './Navbar';
import { lightTheme, palette } from './theme';

function render(
  props: Partial<Parameters<typeof Navbar>[0]> = {},
): ReactTestRenderer {
  const onNavigate = props.onNavigate ?? vi.fn();
  const onCompose = props.onCompose ?? vi.fn();
  return create(
    createElement(Navbar, {
      active: 'feed',
      onNavigate,
      onCompose,
      ...props,
    }),
  ) as ReactTestRenderer;
}

const flat = (style: unknown): Record<string, unknown>[] =>
  Array.isArray(style)
    ? style.flatMap(flat)
    : style && typeof style === 'object'
      ? [style as Record<string, unknown>]
      : [];

const merged = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...flat(style));

// Container pill: o Animated.View raiz do Navbar.
function pill(r: ReactTestRenderer): Record<string, unknown> {
  const views = r.root.findAllByType(Animated.View);
  expect(views.length).toBeGreaterThan(0);
  return merged(views[0]?.props.style);
}

// Valor animado lido do estilo (stub guarda o valor em `.v`).
const anim = (v: unknown): number =>
  (v as { v: number } | undefined | null)?.v ?? Number.NaN;

describe('Navbar (spec D13 — pill flutuante)', () => {
  it('renderiza os 5 itens: feed, buscar, avaliar, mapa, perfil', () => {
    const r = render();
    const labels = r.root
      .findAll((n) => n.props?.accessibilityLabel)
      .map((n) => String(n.props.accessibilityLabel));
    expect(labels).toEqual(
      expect.arrayContaining([
        'feed',
        'buscar',
        'avaliar restaurante',
        'mapa',
        'perfil',
      ]),
    );
  });

  it('navega: feed/busca/mapa/perfil chamam onNavigate e + chama onCompose', () => {
    const onNavigate = vi.fn();
    const onCompose = vi.fn();
    const r = render({ onNavigate, onCompose });
    act(() => {
      r.root.findByProps({ accessibilityLabel: 'feed' }).props.onPress();
    });
    act(() => {
      r.root.findByProps({ accessibilityLabel: 'buscar' }).props.onPress();
    });
    act(() => {
      r.root.findByProps({ accessibilityLabel: 'mapa' }).props.onPress();
    });
    act(() => {
      r.root.findByProps({ accessibilityLabel: 'perfil' }).props.onPress();
    });
    expect(onNavigate.mock.calls.map((c) => c[0])).toEqual([
      'feed',
      'busca',
      'mapa',
      'perfil',
    ]);
    act(() => {
      r.root.findByProps({ accessibilityLabel: 'avaliar restaurante' })
        .props.onPress();
    });
    expect(onCompose).toHaveBeenCalled();
  });

  it('pill: absoluta, raio 32, altura 64, left/right/bottom 16', () => {
    const r = render();
    const style = pill(r);
    expect(style.position).toBe('absolute');
    expect(style.borderRadius).toBe(32);
    expect(anim(style.height)).toBe(64);
    expect(anim(style.left)).toBe(16);
    expect(anim(style.right)).toBe(16);
    expect(anim(style.bottom)).toBe(16);
  });

  it('estado mini: left/right 72, altura 48, bottom 12', () => {
    const r = render({ mini: true });
    const style = pill(r);
    expect(anim(style.left)).toBe(72);
    expect(anim(style.right)).toBe(72);
    expect(anim(style.height)).toBe(48);
    expect(anim(style.bottom)).toBe(12);
  });

  it('transição mini em runtime: timing anima para as dimensões menores', () => {
    const r = render();
    expect(anim(pill(r).left)).toBe(16);
    const onNavigate = vi.fn();
    const onCompose = vi.fn();
    act(() => {
      r.update(
        createElement(Navbar, {
          active: 'feed',
          onNavigate,
          onCompose,
          mini: true,
        }),
      );
    });
    expect(anim(pill(r).left)).toBe(72);
    expect(anim(pill(r).height)).toBe(48);
  });

  it('fundo translúcido do tema e borda da linha', () => {
    const r = render();
    const style = pill(r);
    expect(String(style.backgroundColor)).toContain('rgba(');
    expect(style.borderColor).toBe(lightTheme.line);
    expect(style.borderWidth).toBeGreaterThan(0);
  });

  it('perfil é círculo rosa 28 (sem glyph)', () => {
    const r = render();
    const me = r.root.findByProps({ testID: 'navbar-perfil' });
    const style = merged(me.props.style);
    expect(style.width).toBe(28);
    expect(style.height).toBe(28);
    expect(style.borderRadius).toBe(14);
    expect(style.backgroundColor).toBe(palette.lambeLambe);
  });

  it('botão + é círculo rosa', () => {
    const r = render();
    const add = r.root.findByProps({ testID: 'navbar-compose' });
    const style = merged(add.props.style);
    expect(style.backgroundColor).toBe(palette.lambeLambe);
    expect(style.borderRadius).toBe(24);
  });
});
