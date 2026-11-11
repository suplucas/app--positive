import { describe, it, expect } from 'vitest';
import { create, act } from 'react-test-renderer';
import { createElement } from 'react';
import { Pressable } from 'react-native';
import { nextTabBarState } from './tabBarState';
import { useTabBarMinimize } from './useTabBarMinimize';

describe('nextTabBarState (tab bar mini por scroll)', () => {
  it('topo (<40) reseta o estado', () => {
    expect(nextTabBarState(20, 100, true)).toEqual({ mini: false, last: 0 });
  });

  it('descendo +7 encolhe', () => {
    expect(nextTabBarState(107, 100, false)).toEqual({
      mini: true,
      last: 107,
    });
  });

  it('subindo -7 expande', () => {
    expect(nextTabBarState(93, 100, true)).toEqual({ mini: false, last: 93 });
  });

  it('deltas pequenos mantêm o estado e atualizam last', () => {
    expect(nextTabBarState(104, 100, false)).toEqual({
      mini: false,
      last: 104,
    });
    expect(nextTabBarState(96, 100, true)).toEqual({ mini: true, last: 96 });
  });
});

// Sonda: expõe mini como children e dispara onScroll via onPress. O
// r.update() re-renderiza com novo y preservando o estado interno do hook.
function Probe({ y }: { y: number }) {
  const { mini, onScroll } = useTabBarMinimize();
  return createElement(Pressable, {
    testID: 'probe',
    onPress: () => onScroll({ nativeEvent: { contentOffset: { y } } } as never),
    children: String(mini),
  });
}

describe('useTabBarMinimize (hook)', () => {
  it('encolhe ao descer, expande ao subir e no topo', () => {
    const r = create(createElement(Probe, { y: 0 }));
    const label = () =>
      String(r.root.findByProps({ testID: 'probe' }).props.children);

    // topo: reseta
    act(() => {
      r.root.findByProps({ testID: 'probe' }).props.onPress();
    });
    expect(label()).toBe('false');

    // desce para 100 → mini
    act(() => {
      r.update(createElement(Probe, { y: 100 }));
    });
    act(() => {
      r.root.findByProps({ testID: 'probe' }).props.onPress();
    });
    expect(label()).toBe('true');

    // continua descendo (+10) → mantém mini
    act(() => {
      r.update(createElement(Probe, { y: 110 }));
    });
    act(() => {
      r.root.findByProps({ testID: 'probe' }).props.onPress();
    });
    expect(label()).toBe('true');

    // sobe -20 → expande
    act(() => {
      r.update(createElement(Probe, { y: 90 }));
    });
    act(() => {
      r.root.findByProps({ testID: 'probe' }).props.onPress();
    });
    expect(label()).toBe('false');

    // volta ao topo (y<40) → continua expandido e reseta last
    act(() => {
      r.update(createElement(Probe, { y: 10 }));
    });
    act(() => {
      r.root.findByProps({ testID: 'probe' }).props.onPress();
    });
    expect(label()).toBe('false');
  });
});
