import { describe, it, expect, vi } from 'vitest';
import { create, ReactTestRenderer, act } from 'react-test-renderer';
import { createElement } from 'react';
import { NoteSlider, TICK_W } from './NoteSlider';

function render(props: Partial<Parameters<typeof NoteSlider>[0]> = {}) {
  const r = create(
    createElement(NoteSlider, { value: 8, onChange: vi.fn(), ...props }),
  );
  return r as ReactTestRenderer;
}

function ticks(r: ReactTestRenderer) {
  return r.root.findAll(
    (n) =>
      typeof n.props.testID === 'string' &&
      n.props.testID.startsWith('nota-tick-'),
  );
}

describe('NoteSlider', () => {
  it('mostra o valor na escala 0-10 com uma casa decimal', () => {
    const r = render({ value: 8 });
    expect(JSON.stringify(r.toJSON())).toContain('8.0');
  });

  it('renderiza 21 ticks (0.0 a 10.0 em passos de 0.5)', () => {
    const r = render();
    expect(ticks(r)).toHaveLength(21);
  });

  it('ticks inteiros exibem o número, meias ficam silenciosas', () => {
    const r = render({ value: 8 });
    const inteiro = r.root.findByProps({ testID: 'nota-tick-8.0' });
    expect(
      inteiro.findAll((n) => String(n.type) === 'Text' && n.props.children === 8),
    ).toHaveLength(1);
    const meia = r.root.findByProps({ testID: 'nota-tick-8.5' });
    expect(
      meia.findAll((n) => String(n.type) === 'Text' && typeof n.props.children === 'number'),
    ).toHaveLength(0);
  });

  it('tocar num tick chama onChange com o valor do tick', () => {
    const onChange = vi.fn();
    const r = render({ onChange });
    act(() => {
      r.root.findByProps({ testID: 'nota-tick-9.5' }).props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith(9.5);
  });

  it('trilha de ticks usa layout em linha (flexDirection row) com os 21 ticks como filhos', () => {
    const r = render();
    const track = r.root.findByProps({ testID: 'nota-track' });
    const style = track.props.style as
      | object
      | object[]
      | undefined;
    const flat = Array.isArray(style) ? style.flat() : style ? [style] : [];
    expect(
      flat.some((s) => (s as { flexDirection?: string })?.flexDirection === 'row'),
    ).toBe(true);
    const trackTicks = track.findAll(
      (n) =>
        typeof n.props.testID === 'string' &&
        n.props.testID.startsWith('nota-tick-'),
    );
    expect(trackTicks).toHaveLength(21);
  });

  it('fim do scroll resolve para o meio-passo mais próximo', () => {
    const onChange = vi.fn();
    const r = render({ onChange });
    const scroll = r.root.findByProps({ testID: 'nota-scroll' });
    act(() => {
      scroll.props.onMomentumScrollEnd({
        nativeEvent: { contentOffset: { x: TICK_W * 4 + 5 } },
      });
    });
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
