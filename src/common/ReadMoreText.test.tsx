import { describe, it, expect } from 'vitest';
import { create, act } from 'react-test-renderer';
import { createElement } from 'react';
import { Text } from 'react-native';
import { ReadMoreText } from './ReadMoreText';

describe('ReadMoreText (ler mais medido por layout)', () => {
  function render(text: string, lines = 2) {
    return create(
      createElement(ReadMoreText, {
        text,
        numberOfLines: lines,
        testID: 'rm',
      }),
    );
  }

  // Dispara o onTextLayout do Text principal com N linhas medidas.
  function layout(r: ReturnType<typeof create>, lines: number) {
    const text = r.root
      .findAllByType(Text)
      .find((node) => typeof node.props.onTextLayout === 'function');
    if (!text) throw new Error('Text sem onTextLayout');
    act(() => {
      text.props.onTextLayout({
        nativeEvent: { lines: Array.from({ length: lines }) },
      });
    });
  }

  function tap(r: ReturnType<typeof create>) {
    act(() => {
      r.root.findByProps({ testID: 'rm-toggle' }).props.onPress();
    });
  }

  function toggleLabel(r: ReturnType<typeof create>): string {
    const toggle = r.root.findByProps({ testID: 'rm-toggle' });
    const label = toggle.findAllByType(Text)[0]!;
    return String(label.props.children);
  }

  it('sem truncamento não mostra o botão', () => {
    const r = render('texto curto');
    layout(r, 1);
    expect(r.root.findAllByType(Text)).toHaveLength(1);
    expect(() => r.root.findByProps({ testID: 'rm-toggle' })).toThrow();
  });

  it('truncado mostra ler mais; tap alterna ver menos/ler mais', () => {
    const r = render('texto longo que passa de duas linhas');
    layout(r, 5); // mediu 5 linhas com clamp 2
    expect(toggleLabel(r)).toBe('ler mais');
    tap(r);
    expect(toggleLabel(r)).toBe('ver menos');
    tap(r);
    expect(toggleLabel(r)).toBe('ler mais');
  });

  it('expandido renderiza o texto inteiro (numberOfLines undefined)', () => {
    const r = render('texto longo');
    layout(r, 5);
    tap(r);
    const body = r.root
      .findAllByType(Text)
      .find((node) => typeof node.props.onTextLayout === 'function')!;
    expect(body.props.numberOfLines).toBeUndefined();
    // recolhido volta ao clamp
    tap(r);
    expect(
      r.root
        .findAllByType(Text)
        .find((node) => typeof node.props.onTextLayout === 'function')!
        .props.numberOfLines,
    ).toBe(2);
  });
});
