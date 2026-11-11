import { describe, expect, it } from 'vitest';
import { darkTheme, lightTheme, palette, radius, spacing, type } from './theme';

describe('tokens de design', () => {
  it('espaçamento segue a grade de 4px', () => {
    expect(spacing).toMatchObject({
      micro: 4,
      interno: 8,
      medio: 12,
      padrao: 16,
      grande: 20,
      secao: 24,
      bloco: 32,
    });
    expect(Object.values(spacing).every((v) => v % 4 === 0)).toBe(true);
  });

  it('cores e escalas auxiliares existem', () => {
    expect(palette.piclesInk).toBe('#4C6027');
    expect(palette.overlay).toBe('rgba(36,26,34,0.55)');
    expect(palette.overlayStrong).toBe('rgba(36,26,34,0.82)');
    expect(type.body).toBe(13);
    expect(radius.card).toBe(12);
  });

  it('token unreadBg por modo (POC notificações)', () => {
    expect(lightTheme.unreadBg).toBe('rgba(242,169,59,0.14)');
    expect(darkTheme.unreadBg).toBe('rgba(242,169,59,0.09)');
    expect(lightTheme.unreadBg).not.toBe(darkTheme.unreadBg);
  });
});
