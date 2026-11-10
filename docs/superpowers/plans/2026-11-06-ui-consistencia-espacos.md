# Consistência de UI e espaçamento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os 15 apontamentos da auditoria de UI do `app--positive`, com espaçamento na grade de 4px, topbars iguais, alvos de toque de 44px e sem código morto.

**Architecture:** Mudanças só no app Expo. Tokens em `src/common/theme.ts`, estilos de topbar em `src/common/layout.ts`, decoração do feed em `src/feed/decorateFeed.ts` e o wrapper de camada em `src/common/LayerScreen.tsx`. Nenhuma mudança de API, dados ou navegação.

**Tech Stack:** Expo SDK 58 / React Native 0.88 / React 19 / TypeScript 6 / Vitest 5 / Prettier 3.

**Spec:** `docs/superpowers/specs/2026-11-06-ui-consistencia-espacos-design.md`

## Global Constraints

- Todo `padding`/`margin`/`gap` de layout com valor >= 4 é múltiplo de 4. Exceções ópticas: -3 a 3. Exceção de overlap: `marginTop: -16` do botão "+".
- Arredondamento para a grade: `5→4`, `6/7/9→8`, `10/11/13→12`, `14→16`, `18→20`, `22→24`; empate sobe.
- A search bar do mapa permanece. Só a seta sem handler sai.
- Nenhum hex de marca (`#241A22`, `#FBF2E4`, `#F2A93B`, `#E63E75`, `#7A9A3D`, `#fff`) em arquivos `.tsx`.
- Botões de voltar e ações de topbar têm alvo mínimo de 44×44.
- Copy em pt-BR, minúscula/sentence case como hoje; não reescrever textos.
- Rodar `npm run typecheck && npm test` em toda task. Rodar `npm run format:check` da task 2 em diante.
  - `npm test` termina com código 1 por um erro conhecido do `ErrorBoundary.test.tsx` (React 19 concurrent rendering) mesmo com 38/38 arquivos e 276/276 testes passando; isso é o baseline `b00fc18`. O critério é o resumo 38/38 + 276/276, sem nenhum outro erro.
- Um commit por task.

## Findings → Tasks

| # | Achado | Task |
|---|--------|------|
| 1 | Texto JSX vazando no mapa | 6 |
| 2 | Arquivos mortos | 8 |
| 3 | Seta de voltar sem handler | 6 |
| 4 | 93 espaçamentos fora da grade | 2, 4 |
| 5 | Topbars inconsistentes | 3 |
| 6 | Alvos de toque < 44px | 3 |
| 7 | Separadores de metadados | 5 |
| 8 | Docs/tokens desatualizados | 2 |
| 9 | Formatação sem padrão | 1 |
| 10 | Cores hardcoded | 6, 7 |
| 11 | Flair forte nunca renderizado | 5 |
| 12 | Tipografia/raios fragmentados | 2, 4 |
| 13 | Estilo/bloco morto no mapa | 6 |
| 14 | Testes na raiz de `src` | 8 |
| 15 | `App.tsx` grande | 5, 8 |

## Review Focus

- **Dark mode:** toda cor trocada por token continua legível nos dois temas, especialmente overlays e `t.line`.
- **Tela estreita (320px):** aumentar espaçamentos não pode estourar linhas de chips, stats ou topbar.
- **Feed sem foto / sem nota / sem flair:** `decorateFeed` não pode quebrar e o flair forte aparece no máximo uma vez.
- **Busca do mapa com resultado OSM e sem bairro:** o texto mostra `categoria · endereço · osm`, nunca código ou `undefined`.
- **Voltar em todas as camadas:** cada tela ainda fecha; nenhuma seta morta; alvo de 44px.

---

### Task 1: Prettier e formatação base

**Files:**
- Create: `.prettierrc`, `.prettierignore`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm run format` e `npm run format:check`.

- [ ] **Step 1: Criar `.prettierrc`**

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

- [ ] **Step 2: Criar `.prettierignore`**

```text
node_modules
.expo
package-lock.json
docs
assets
```

- [ ] **Step 3: Instalar e configurar o Prettier**

Run: `npm install --save-dev prettier@^3.4.2`

Isso adiciona `"prettier": "^3.4.2"` em `devDependencies` (mesma faixa
do `api--positive--feed`) e atualiza `package-lock.json`. Depois,
adicionar os scripts em `package.json`:

```json
"format": "prettier --write \"App.tsx\" \"src/**/*.{ts,tsx}\"",
"format:check": "prettier --check \"App.tsx\" \"src/**/*.{ts,tsx}\""
```

- [ ] **Step 4: Rodar o check e confirmar que falha**

Run: `npm run format:check`
Expected: FAIL listando `App.tsx`, `src/common/theme.ts`, `src/common/format.ts` e outros com aspas duplas/indentação.

- [ ] **Step 5: Formatar**

Run: `npm run format`

- [ ] **Step 6: Verificar**

Run: `npm run format:check && npm run typecheck && npm test`
Expected: `format:check` e `typecheck` passam; `npm test` mostra 38/38 arquivos e 276/276 testes. O exit 1 do `ErrorBoundary` é o baseline conhecido (ver Global Constraints).

- [ ] **Step 7: Commit**

```bash
git add .prettierrc .prettierignore package.json package-lock.json App.tsx src
git commit -m "chore(app): padroniza formatação com prettier"
```

---

### Task 2: Tokens de design e docs

**Files:**
- Modify: `src/common/theme.ts`
- Modify: `docs/01/04-tokens-de-design.md`
- Modify: `docs/01/01-ui-ux-visual-language.md`
- Modify: `docs/01/INDICE.md`
- Test: `src/common/theme.test.ts`

**Interfaces:**
- Produces: `spacing.medio: 12`, `spacing.grande: 20`, `palette.piclesInk`, `palette.overlay`, `palette.overlayStrong`, `type`, `radius`.

- [ ] **Step 1: Escrever o teste dos tokens**

Criar `src/common/theme.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { palette, radius, spacing, type } from './theme';

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
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/common/theme.test.ts`
Expected: FAIL porque `medio`, `grande`, `piclesInk` etc. não existem.

- [ ] **Step 3: Adicionar os tokens em `src/common/theme.ts`**

Em `palette`, adicionar:

```ts
piclesInk: '#4C6027',
overlay: 'rgba(36,26,34,0.55)',
overlayStrong: 'rgba(36,26,34,0.82)',
```

Em `spacing`, adicionar `medio: 12` entre `interno` e `padrao`, e `grande: 20` entre `padrao` e `secao`.

Adicionar:

```ts
export const type = {
  caption: 11,
  small: 12,
  body: 13,
  bodyLarge: 14,
  title: 16,
  heading: 18,
  page: 22,
  hero: 30,
} as const;

export const radius = {
  chip: 5,
  thumb: 10,
  card: 12,
  panel: 16,
  pill: 999,
} as const;
```

- [ ] **Step 4: Rodar o teste**

Run: `npm test -- src/common/theme.test.ts`
Expected: PASS.

- [ ] **Step 5: Atualizar os docs**

Em `docs/01/04-tokens-de-design.md`:
- `--spacing-blocO` → `--spacing-bloco`.
- Adicionar `--spacing-medio: 12px;` e `--spacing-grande: 20px;`.
- Trocar `src/theme.ts` por `src/common/theme.ts` na última linha.
- Remover a linha placeholder `--color-pink-dark: ...;`.
- Documentar `type` e `radius` com os valores acima e a regra: meios-pixels são exceção óptica.

Em `docs/01/01-ui-ux-visual-language.md`:
- Adicionar 12 e 20 na tabela de espaçamento.
- Corrigir `Contraste ( Sobre berinjela )` para `Contraste (sobre berinjela)`.

Em `docs/01/INDICE.md`:
- Trocar `src/theme.ts` por `src/common/theme.ts`.

- [ ] **Step 6: Verificar e commitar**

Run: `npm run format:check && npm run typecheck && npm test`
Expected: PASS.

```bash
git add src/common/theme.ts src/common/theme.test.ts docs/01
git commit -m "feat(app): amplia tokens de espaçamento e documenta escalas"
```

---

### Task 3: Topbar compartilhada e alvos de 44px

**Files:**
- Create: `src/common/layout.ts`
- Modify: `src/settings/SettingsScreen.tsx`
- Modify: `src/settings/NotificationScreen.tsx`
- Modify: `src/comments/CommentThreadScreen.tsx`
- Modify: `src/map/SearchScreen.tsx`
- Modify: `src/map/MapScreen.tsx`
- Modify: `src/profile/UserProfileScreen.tsx`
- Modify: `src/profile/EditProfileForm.tsx`
- Modify: `src/compose/ComposeV2.tsx`
- Modify: `src/restaurant/RestaurantProfileTemplate.tsx`
- Test: `src/common/layout.test.ts`

**Interfaces:**
- Consumes: `spacing` de `theme.ts`.
- Produces: `layout.topbar`, `layout.divider`, `layout.backHit`,
  `layout.backIcon`, `layout.actionHit`.

- [ ] **Step 1: Escrever o teste**

Criar `src/common/layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { StyleSheet } from 'react-native';
import { layout } from './layout';

describe('layout compartilhado', () => {
  it('topbar usa 16/8 com gap 8', () => {
    expect(layout.topbar).toMatchObject({
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    });
  });

  it('alvos de toque têm 44px', () => {
    expect(layout.backHit).toMatchObject({ minWidth: 44, minHeight: 44 });
    expect(layout.actionHit).toMatchObject({ minHeight: 44 });
  });

  it('separador é hairline', () => {
    expect(layout.divider.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/common/layout.test.ts`
Expected: FAIL porque `./layout` não existe.

- [ ] **Step 3: Criar `src/common/layout.ts`**

```ts
import { StyleSheet } from 'react-native';
import { spacing } from './theme';

// Base das topbars de sub-tela (docs/01 §3): 16/8, gap 8, alvo 44.
export const layout = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
    paddingBottom: spacing.interno,
  },
  backHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20 },
  actionHit: { minHeight: 44, justifyContent: 'center' },
  // Separador da topbar; a cor vem do tema na tela (`borderBottomColor`).
  divider: { borderBottomWidth: StyleSheet.hairlineWidth },
});
```

- [ ] **Step 4: Aplicar nas telas**

Todas usam `layout.topbar`; a diferença é só o separador, o alinhamento e
o botão de ação. Onde a topbar distribui itens nas pontas, o
`justifyContent: 'space-between'` fica **local** (não entra no
`layout.topbar`, que é usado por telas com um único filho). Onde há
separador, usar `[layout.topbar, layout.divider, { borderBottomColor: t.line }]`.

- `SettingsScreen`: remove `topbar`, `backHit`, `backText`; usa
  `[layout.topbar, layout.divider, { borderBottomColor: t.line }]`,
  `layout.backHit` e `layout.backIcon` na seta. Sem `justifyContent`
  extra (topbar tem um filho só).
- `SearchScreen`: remove `header` e `back`; usa
  `[layout.topbar, layout.divider, { borderBottomColor: t.line }]`,
  `layout.backHit` e `layout.backIcon`. Sem `justifyContent` extra (o
  `TextInput` já tem `flex: 1`).
- `UserProfileScreen`: remove `topbar` e `back`; usa
  `[layout.topbar, layout.divider, { borderBottomColor: t.line }]`,
  `layout.backHit` e `layout.backIcon`. Sem `justifyContent` extra.
- `CommentThreadScreen`: remove `topbar`; usa
  `[layout.topbar, layout.divider, { borderBottomColor: t.line }]`.
  Mantém o círculo `tbtn` de 32 com `hitSlop={6}` (44 efetivo) e troca o
  `fontSize` do ícone por `layout.backIcon`.
- `NotificationScreen`: remove `topbar`; usa
  `[layout.topbar, layout.divider, { borderBottomColor: t.line }]`.
  Mantém o círculo `tbtn` com `hitSlop={6}` e usa `layout.backIcon`.
- `RestaurantProfileTemplate`: mantém o círculo de 32 sobre a capa com
  `hitSlop={6}` (44 efetivo). Usa
  `[layout.topbar, { backgroundColor: t.bg, justifyContent: 'space-between' }]`
  (sem `layout.divider`) e `layout.backIcon`.
- `MapScreen`: usa `[layout.topbar, { justifyContent: 'space-between' }]`
  no header (sem separador; o título fica à esquerda e a busca à direita).
  A seta dentro da busca usa `layout.backHit` e `layout.backIcon`; o
  `marginRight` do `searchBack` sai (o `gap` do topbar já separa).
- `ComposeV2` e `EditProfileForm`: remove `subHeader`; usa
  `[layout.topbar, layout.divider, { borderBottomColor: t.line }]`.
  Como o cabeçalho tem três itens (cancelar · título · publicar/salvar),
  acrescentar `justifyContent: 'space-between'` local. O botão `cancelar`
  recebe `style={layout.actionHit}`; `publicar`/`salvar` trocam
  `minHeight: 32` por `minHeight: 44`.
- `RestaurantProfileTemplate`, `CommentThread` e `Notification`: manter
  `hitSlop` onde o círculo de 32 já soma 44.

- [ ] **Step 5: Rodar testes e conferir**

Run: `npm test -- src/common/layout.test.ts && npm run typecheck && npm test`
Expected: PASS; os testes de telas continuam encontrando `voltar`, `cancelar-v2`, `cancelar-perfil`.

- [ ] **Step 6: Commit**

```bash
git add src/common/layout.ts src/common/layout.test.ts src/settings src/comments/CommentThreadScreen.tsx src/map src/profile/UserProfileScreen.tsx src/profile/EditProfileForm.tsx src/compose/ComposeV2.tsx src/restaurant/RestaurantProfileTemplate.tsx
git commit -m "feat(app): unifica topbars e alvos de toque"
```

---

### Task 4: Normalização do espaçamento

**Files:**
- Modify: todos os `.tsx` com `StyleSheet` em `src/`
- Test: `src/common/spacing-usage.test.ts`

**Interfaces:**
- Consumes: `spacing.medio`, `spacing.grande`, `layout.topbar`.
- Produces: nenhum valor de layout fora da grade de 4px.

- [ ] **Step 1: Escrever o teste de varredura**

Criar `src/common/spacing-usage.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/common/spacing-usage.test.ts`
Expected: FAIL com 90+ linhas. As primeiras incluem `feed/FeedCard.tsx gap: 11`, `feed/FeedQuote.tsx gap: 9`, `profile/ProfileScreen.tsx gap: 14`.

- [ ] **Step 3: Aplicar o mapa de arredondamento**

Em cada arquivo apontado, trocar valores crus por tokens/grid:

| Valor atual | Novo |
|---|---|
| 5 | `spacing.micro` (4) |
| 6, 7, 9 | `spacing.interno` (8) |
| 10, 11, 13 | `spacing.medio` (12) |
| 14 | `spacing.padrao` (16) |
| 18 | `spacing.grande` (20) |
| 22 | `spacing.secao` (24) |

Manter 1, 2, 3 como exceção óptica; adicionar `// óptico: ...` quando o motivo não for óbvio.

- [ ] **Step 4: Resolver as expressões `spacing.x ± n`**

As linhas abaixo são as de antes da Task 3; se tiverem mudado, localize
pelo `grep -rn "spacing\.[a-z]* *[+-]" src` e aplique a mesma regra.

- `ProfileScreen.tsx:385` e `UserProfileScreen.tsx:132`: `spacing.secao - 4` → `spacing.grande`.
- `ProfileScreen.tsx:437`: `spacing.padrao - 2` → `spacing.padrao`.
- `ProfileScreen.tsx:441,451`, `FeedPhoto.tsx:317,323`, `FeedQuote.tsx:140`, `MapScreen.tsx:489`: `spacing.interno + 2` → `spacing.medio`.
- `FeedQuote.tsx:143`: `spacing.padrao - 2` → `spacing.padrao`.
- `FeedPhoto.tsx:241`: `spacing.padrao - 3` → `spacing.medio`.
- `ComposeV2.tsx:548,558,567`, `EditProfileForm.tsx:223`: `spacing.interno + 4` → `spacing.medio`.
- `ComposeV2.tsx:617`: `spacing.interno + 8` → `spacing.padrao`.
- `Navbar.tsx:103`: `spacing.interno + 4` → `spacing.medio`.
- `EditProfileForm.tsx:208`: `spacing.bloco - 4` (28) continua; já é múltiplo de 4.
- `MapScreen.tsx:550`: `spacing.interno - 2` → `spacing.interno`.

- [ ] **Step 5: Substituir valores exatos por tokens de tipografia/raio**

Só onde o valor já bate: `fontSize: 11` → `type.caption`, `12` → `type.small`, `13` → `type.body`, `14` → `type.bodyLarge`, `16` → `type.title`, `18` → `type.heading`, `22` → `type.page`, `30` → `type.hero`. Raios: `5` → `radius.chip`, `10` → `radius.thumb`, `12` → `radius.card`, `16` → `radius.panel`, `999` → `radius.pill`. Não migrar meios-pixels.

- [ ] **Step 6: Rodar o teste e a suíte**

Run: `npm test -- src/common/spacing-usage.test.ts && npm run typecheck && npm test`
Expected: PASS; 0 offenders.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "style(app): normaliza espaçamento na grade de 4px"
```

---

### Task 5: Feed — separadores, flair forte e decoração

**Files:**
- Create: `src/feed/decorateFeed.ts`, `src/feed/decorateFeed.test.ts`
- Modify: `App.tsx`
- Modify: `src/feed/FeedCard.tsx`
- Modify: `src/feed/FeedQuote.tsx`
- Modify: `src/feed/FeedPhoto.tsx`
- Test: `src/feed/FeedQuote.test.tsx`, `src/feed/FeedPhoto.test.tsx`

**Interfaces:**
- Produces:

```ts
export type Decorated = {
  layout: ReviewLayout;
  photos?: ImageSourcePropType[];
  tone?: 'mostarda' | 'lambeLambe';
  strong: boolean;
};

export function decorateFeed(items: Review[]): Map<Review['id'], Decorated>;
```

- `FeedQuote` e `FeedPhoto` passam a aceitar `strong?: boolean`.

- [ ] **Step 1: Escrever o teste da decoração**

Criar `src/feed/decorateFeed.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { decorateFeed } from './decorateFeed';
import type { Review } from '../common/types';

const review = (over: Partial<Review>): Review => ({
  id: 1,
  userId: 'u',
  restaurantId: '1',
  rating: 4,
  comment: 'ok',
  likes: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('decorateFeed', () => {
  it('marca no máximo uma review forte por tela', () => {
    const map = decorateFeed([
      review({ id: 1, rating: 5, layout: 'row' }),
      review({ id: 2, rating: 5, layout: 'row' }),
    ]);
    expect(map.get(1)?.strong).toBe(true);
    expect(map.get(2)?.strong).toBe(false);
  });

  it('foto remota vence o mock', () => {
    const map = decorateFeed([
      review({ id: 3, layout: 'photo', photoUrl: '/f.jpg' }),
    ]);
    expect(map.get(3)?.photos).toHaveLength(1);
    expect(map.get(3)?.photos?.[0]).toMatchObject({
      uri: expect.stringContaining('/f.jpg'),
    });
  });

  it('sem foto e nota baixa vira linha', () => {
    const map = decorateFeed([review({ id: 4, rating: 2, layout: undefined })]);
    expect(map.get(4)?.layout).toBe('row');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/feed/decorateFeed.test.ts`
Expected: FAIL porque `./decorateFeed` não existe.

- [ ] **Step 3: Criar `src/feed/decorateFeed.ts`**

Mover a lógica de `App.tsx:208-253` e a constante `STRONG_NOTE = 9`.
Imports:

```ts
import type { ImageSourcePropType } from 'react-native';
import { resolvePhotoUrl } from '../common/format';
import type { Review, ReviewLayout } from '../common/types';
import { MOCK_POST_PHOTOS, photoFor, photosFor } from './postPhotos';
```

A função percorre `items`, calcula foto remota/mock, layout e tom, e
mantém `strongUsed` para o destaque. **Duas noções distintas de "forte":**

- `highRating = item.rating != null && item.rating * 2 >= STRONG_NOTE` —
  usada para derivar o layout (`quote` quando não há foto), como hoje.
- `strong = highRating && !strongUsed` — usada só para o flair; depois de
  marcar a primeira, `strongUsed = true`.

Toda entrada do map tem `strong: boolean`.

- [ ] **Step 4: Usar no `App.tsx`**

- Substituir o bloco inline por
  `const decorated = useMemo(() => decorateFeed(items), [items]);`
  (mantém o `useMemo`, que já é importado, para não recalcular a cada
  render).
- Remover `STRONG_NOTE` e os imports `photoFor`, `photosFor`,
  `MOCK_POST_PHOTOS`, `resolvePhotoUrl`, `ReviewLayout` e
  `ImageSourcePropType` se ficarem sem uso.
- Passar `strong={d?.strong}` em `FeedPhoto`, `FeedQuote` e `FeedCard`.

- [ ] **Step 5: Aceitar `strong` nos cards**

- `FeedQuote`: adicionar `strong = false` nas props e `<Flair label={...} strong={strong} />`.
- `FeedPhoto`: adicionar `strong = false` nas props e `<Flair label={...} strong={strong} />`.
- `FeedCard`: já aceita.

- [ ] **Step 6: Corrigir separadores**

- `FeedQuote.tsx:80`: remover o `·` inicial de `· {formatRelative(...)}`.
- `App.tsx:302`: remover o `·` inicial de `· tentar de novo`.
- Não adicionar `·` em linhas de nós separados por `gap`.

- [ ] **Step 7: Testes dos cards**

Adicionar em `FeedQuote.test.tsx`:

```ts
it('com strong renderiza flair-forte', () => {
  const { r } = render({
    review: { ...baseReview, flairs: ['chorei de tão bom'] },
    strong: true,
  });
  expect(r.root.findAllByProps({ testID: 'flair-forte' })).toHaveLength(1);
});
```

Adicionar o mesmo em `FeedPhoto.test.tsx` com `review: { ...baseReview, flairs: [...] }` e `strong: true`.

- [ ] **Step 8: Verificar e commitar**

Run: `npm test -- src/feed && npm run typecheck && npm test`
Expected: PASS.

```bash
git add App.tsx src/feed
git commit -m "feat(app): liga flair forte e separa decoração do feed"
```

---

### Task 6: Mapa — texto vazando, seta e estilos mortos

**Files:**
- Modify: `src/map/MapScreen.tsx`
- Test: `src/map/MapScreen.test.tsx`

**Interfaces:**
- Consumes: `layout.topbar`.
- Produces: resultado de busca com texto correto; seta só com `onBack`.

- [ ] **Step 1: Atualizar o mock e escrever os testes**

Em `src/map/MapScreen.test.tsx`:

- Trocar o mock para `vi.mock('../api/place', () => ({ getPlaces: vi.fn(), searchPlaces: vi.fn() }))`.
- Importar `searchPlaces`.
- No `beforeEach`, `vi.mocked(searchPlaces).mockResolvedValue([])`.

Adicionar:

```ts
it('resultado OSM não mostra código na tela', async () => {
  vi.mocked(searchPlaces).mockResolvedValue([
    {
      id: 'osm:1',
      source: 'osm',
      nome: 'Bar do Zé',
      endereco: 'Rua A',
      categoria: 'bar',
      bairro: 'Centro',
      lat: -23.5,
      lng: -46.6,
    },
  ]);
  const { r } = await render();
  act(() => {
    byID(r, 'mapa-busca-input').props.onChangeText('bar');
  });
  act(() => {
    byID(r, 'mapa-busca-input').props.onSubmitEditing({
      nativeEvent: { text: 'bar' },
    });
  });
  await act(async () => {});
  expect(allText(r)).toContain('bar · Centro · osm');
  expect(allText(r)).not.toContain('hit.source');
});

it('sem onBack não renderiza seta de voltar', async () => {
  const { r } = await render();
  expect(r.root.findAllByProps({ testID: 'mapa-busca-voltar' })).toHaveLength(0);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/map/MapScreen.test.tsx`
Expected: o teste do texto falha porque `allText` contém `+ (hit.source...`; o teste da seta falha porque ela sempre renderiza.

- [ ] **Step 3: Corrigir o texto**

Em `src/map/MapScreen.tsx:300-303`, trocar por:

```tsx
<Text style={[s.resultMeta, { color: t.sub }]}>
  {[hit.categoria, hit.bairro ?? hit.endereco]
    .filter(Boolean)
    .join(' · ') + (hit.source === 'osm' ? ' · osm' : '')}
</Text>
```

- [ ] **Step 4: Esconder a seta sem handler**

Envolver o `Pressable` de `testID="mapa-busca-voltar"` em `{onBack ? (...) : null}`. A search bar continua sempre visível.

- [ ] **Step 5: Remover estilo e bloco mortos**

- Apagar `searchBar` do `StyleSheet` e reaproveitar o que importa em
  `searchWrap`: acrescentar `flexDirection: 'row'`, `alignItems: 'center'`
  e `gap: spacing.interno`. O `searchWrap` está como coluna hoje, o que
  empilha seta/input/×; a barra de busca deve ficar em linha.
- Remover `marginRight: 8` de `searchBack` e `marginLeft: 8` de
  `searchLoading` (o `gap` cobre).
- Apagar o bloco comentado `<View style={s.chipWrap}>...` em `MapScreen.tsx:230-234`.
- Remover `color` hardcoded de `searchError` e `resultMeta` (já são sobrescritos por `t.sub`).

- [ ] **Step 6: Verificar e commitar**

Run: `npm test -- src/map/MapScreen.test.tsx && npm run typecheck && npm test`
Expected: PASS.

```bash
git add src/map/MapScreen.tsx src/map/MapScreen.test.tsx
git commit -m "fix(app): corrige resultado da busca do mapa e seta morta"
```

---

### Task 7: Cores hardcoded restantes

**Files:**
- Modify: `src/common/Navbar.tsx`
- Modify: `src/feed/NoteBadge.tsx`
- Modify: `src/feed/FeedPhoto.tsx`
- Modify: `src/comments/CommentThreadScreen.tsx`
- Modify: `src/settings/NotificationScreen.tsx`
- Modify: `src/restaurant/RestaurantProfileTemplate.tsx`
- Modify: `src/compose/ComposeV2.tsx`

**Interfaces:**
- Consumes: `palette.papel`, `palette.lambeLambe`, `palette.piclesInk`, `palette.overlay`, `palette.overlayStrong`, `t.line`.

- [ ] **Step 1: Substituir os hex/rgba**

Antes de trocar, garanta que `palette` está no import de
`../common/theme` em `NoteBadge.tsx` e `NotificationScreen.tsx` (os
outros arquivos já importam).

- `Navbar.tsx:132` `#E63E75` → `palette.lambeLambe`.
- `Navbar.tsx:136` `#FBF2E4` → `palette.papel`.
- `NoteBadge.tsx:43` `#FBF2E4` → `palette.papel`; `rgba(36,26,34,0.82)` → `palette.overlayStrong`.
- `FeedPhoto.tsx:273` `rgba(36,26,34,0.82)` → `palette.overlayStrong`.
- `CommentThreadScreen.tsx:56` `rgba(36,26,34,0.55)` → `palette.overlay`; `:61` `#fff` → `palette.papel`.
- `NotificationScreen.tsx:54` `rgba(36,26,34,0.55)` → `palette.overlay`; `:59` `#fff` → `palette.papel`.
- `RestaurantProfileTemplate.tsx:66` `rgba(36,26,34,0.55)` → `palette.overlay`; `:71` e `:241` `#fff` → `palette.papel`; `:163` `#4C6027` → `palette.piclesInk`.
- `ComposeV2.tsx:641` `rgba(36,26,34,0.10)` → `t.line` (garantir `const t = useTheme()` no componente).

- [ ] **Step 2: Verificar que não sobrou hex de marca**

Run: `grep -rnE "#(241A22|FBF2E4|F2A93B|E63E75|7A9A3D|4C6027|fff)" src --include=*.tsx | grep -v test | grep -v "^src/MapScreen.tsx"`
Expected: nenhuma saída. (`src/MapScreen.tsx` é a cópia morta que a Task 8
apaga; o Task 9 repete o grep sem essa exceção.)

- [ ] **Step 3: Verificar e commitar**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add src
git commit -m "style(app): troca cores hardcoded por tokens do tema"
```

---

### Task 8: Limpeza, testes no módulo e App menor

**Files:**
- Delete: `src/MapScreen.tsx`, `src/usePlaces.ts`
- Move: `src/ComposeScreen.test.tsx` → `src/compose/ComposeScreen.test.tsx`
- Move: `src/ComposeV2.test.tsx` → `src/compose/ComposeV2.test.tsx`
- Move: `src/postPhotos.test.ts` → `src/feed/postPhotos.test.ts`
- Move: `src/restaurantMock.test.ts` → `src/restaurant/restaurantMock.test.ts`
- Create: `src/common/LayerScreen.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Produces: `LayerScreen({ children }: { children: ReactNode })`, same behavior as `App.tsx:624-655` (estilo `layer` em `App.tsx:595-601`).

- [ ] **Step 1: Confirmar que os arquivos estão mortos**

Run:

```bash
grep -rn "src/MapScreen\|src/usePlaces\|from './MapScreen'\|from './usePlaces'" src App.tsx
```

Expected: nenhuma saída (os arquivos da raiz não são importados).

- [ ] **Step 2: Apagar os arquivos mortos**

```bash
git rm src/MapScreen.tsx src/usePlaces.ts
```

- [ ] **Step 3: Mover os testes e ajustar imports**

```bash
git mv src/ComposeScreen.test.tsx src/compose/ComposeScreen.test.tsx
git mv src/ComposeV2.test.tsx src/compose/ComposeV2.test.tsx
git mv src/postPhotos.test.ts src/feed/postPhotos.test.ts
git mv src/restaurantMock.test.ts src/restaurant/restaurantMock.test.ts
```

Ajustar:

- `src/compose/ComposeScreen.test.tsx`: `./compose/ComposeScreen` → `./ComposeScreen`.
- `src/compose/ComposeV2.test.tsx`: `./compose/ComposeV2` → `./ComposeV2`; `./api/api` → `../api/api`; `./restaurant/restaurantNames` → `../restaurant/restaurantNames`; `./common/types` → `../common/types`.
- `src/feed/postPhotos.test.ts`: `./feed/postPhotos` → `./postPhotos`.
- `src/restaurant/restaurantMock.test.ts`: `./restaurant/restaurantMock` → `./restaurantMock`; `./restaurant/restaurantNames` → `./restaurantNames`.

- [ ] **Step 4: Extrair `LayerScreen`**

Criar `src/common/LayerScreen.tsx` com o componente e o estilo `layer` de `App.tsx:595-601` e `App.tsx:624-655`. Importar `ReactNode`, `useEffect`, `useRef`, `Animated`, `Easing`, `StyleSheet`, `useTheme`.

No `App.tsx`:
- Importar `LayerScreen` de `./src/common/LayerScreen`.
- Remover a função local e o estilo `layer`.
- Remover `type ReactNode` do import de `react` se ficar sem uso.

- [ ] **Step 5: Rodar tudo**

Run:

```bash
npm run typecheck && npm test
grep -rn "src/MapScreen\|src/usePlaces" src App.tsx
```

Expected: testes passam; `grep` sem saída.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(app): remove código morto e extrai camada de tela"
```

---

### Task 9: Verificação final

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-ui-consistencia-espacos-design.md` (status)

- [ ] **Step 1: Rodar a verificação automática**

Run: `npm run format:check && npm run typecheck && npm test`
Expected: `format:check` e `typecheck` passam; `npm test` mostra 38/38 arquivos e 276/276 testes (ou 280+ com os novos). O exit 1 do `ErrorBoundary` é o baseline conhecido (ver Global Constraints).

Run: `grep -rnE "#(241A22|FBF2E4|F2A93B|E63E75|7A9A3D|4C6027|fff)" src --include=*.tsx | grep -v test`
Expected: nenhuma saída (os arquivos mortos já foram apagados).

- [ ] **Step 2: Checklist visual no emulador**

Conferir em claro e escuro:

- Feed: card de foto, quote, linha; flair forte no máximo 1.
- Busca: resultado local e OSM sem código.
- Mapa: search bar funciona; sem seta quando aberto pela aba; sheet e cards.
- Perfil: topbar, stats, abas, diário.
- Restaurante: capa, botões, chips, lista.
- Configurações, notificações, comentários, avaliação e editar perfil: topbar 16/8, voltar/cancelar com 44px.
- Tela estreita (320px): chips e stats sem estouro.

- [ ] **Step 3: Atualizar o status do spec**

Trocar `**Status:** proposta para revisão` por `**Status:** implementado` no spec.

- [ ] **Step 4: Commit final**

```bash
git add docs/superpowers/specs/2026-11-06-ui-consistencia-espacos-design.md
git commit -m "docs(app): registra conclusão da consistência de UI"
```
