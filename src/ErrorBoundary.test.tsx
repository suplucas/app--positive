import { describe, it, expect } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement, type ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

function Throwing(): ReactNode {
  throw new Error('boom permanente');
}

function textOf(r: ReactTestRenderer): string {
  return JSON.stringify(r.toJSON());
}

describe('ErrorBoundary (docs/14, E3)', () => {
  it('sem erro: children passam sem fallback', () => {
    const r = create(
      createElement(ErrorBoundary, null, createElement('Text', null, 'tudo bem')),
    );
    expect(textOf(r)).toContain('tudo bem');
    expect(textOf(r)).not.toContain('algo quebrou');
  });

  it('erro permanente no mount: fallback de produto, sem estourar o app', () => {
    const r = create(
      createElement(ErrorBoundary, null, createElement(Throwing)),
    );
    const text = textOf(r);
    expect(text).toContain('algo quebrou');
    expect(r.root.findByProps({ testID: 'erro-boundary' })).toBeTruthy();
    expect(text).not.toContain('boom permanente');
  });

  it('erro transitivo se resolve sozinho: a criança volta sem retry', () => {
    let gone = false;
    function Flaky(): ReactNode {
      if (!gone) {
        gone = true;
        throw new Error('boom transitivo');
      }
      return createElement('Text', null, 'voltou');
    }
    const r = create(
      createElement(ErrorBoundary, null, createElement(Flaky)),
    );
    expect(textOf(r)).toContain('voltou');
    expect(textOf(r)).not.toContain('algo quebrou');
  });

  it('tentar de novo remonta as crianças de verdade (render sobe)', () => {
    let renders = 0;
    function ThrowingAgain(): ReactNode {
      renders += 1;
      throw new Error(`boom ${renders}`);
    }
    const r = create(
      createElement(ErrorBoundary, null, createElement(ThrowingAgain)),
    );
    expect(textOf(r)).toContain('algo quebrou');
    const before = renders;
    act(() => {
      r.root
        .findByProps({ testID: 'erro-boundary-retry' })
        .props.onPress();
    });
    // continua quebrando → o fallback volta (não é só "esconder");
    // e o contador prova que as crianças remontaram.
    expect(textOf(r)).toContain('algo quebrou');
    expect(renders).toBeGreaterThan(before);
  });
});
