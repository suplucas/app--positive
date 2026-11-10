import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('..', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    // Só módulos: arquivos soltos na raiz de src são testes ou cópias
    // mortas (src/MapScreen.tsx, apagado na Task 8).
    if (dir === SRC) return [];
    return entry.name.endsWith('.tsx') && !entry.name.includes('.test.')
      ? [path]
      : [];
  });
}

describe('espaçamento', () => {
  it('usa a grade de 4px', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(
        /\b(padding|margin|gap)[A-Za-z]*\s*:\s*(-?\d+)/g,
      )) {
        const value = Number(match[2]);
        // Ópticos: -3..3. Overlap conhecido: -16 do botão "+".
        const optical = Math.abs(value) <= 3 || value === -16;
        if (!optical && value % 4 !== 0) {
          offenders.push(`${relative(SRC, file)} ${match[1]}: ${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
