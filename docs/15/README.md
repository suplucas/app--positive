# docs/15 — Carrossel em post com foto

Novo feature do frontend (brainstorm 2026-10). Post de foto do feed
aceita **até 4 fotos**, paginadas com swipe; compose v2 deixa adicionar
várias da galeria.

## O que mudou

- **`src/postPhotos.ts`**: `photosFor(review, index)` — lista de fotos
  do review: `photoIndexes` (2+) → carrossel determinístico; senão,
  array de 1 foto pela regra atual (`photoFor`).
- **`src/types.ts` / `src/mockFeed.ts`**: `Review.photoIndexes?:
  number[]`; 2 itens do feed demo (`mock-3`, `mock-6`) agora têm 2
  fotos — carrossel visível no feed mock.
- **`src/FeedPhoto.tsx`**: prop `photo` → `photos:
  ImageSourcePropType[]`.
  - **1 foto**: comportamento atual intacto (mesmo testID
    `photo-{id}-img`, mesma altura, sem UI de carrossel).
  - **2+ fotos**: `ScrollView` horizontal paginado (`pagingEnabled`,
    página = largura da tela via `useWindowDimensions`) com **dots**
    (`carousel-dot-{id}-{i}`) + contador `1/2` (`carousel-count-{id}`)
    no rodapé esquerdo. Acento único: dot ativo é um pill
    lambe-lambe; inativos, quietos (papel 55%). Selo de nota e o
    scrim/linha do v2 continuam sobre a foto, em qualquer página.
  - Atributos de acessibilidade por página (`"foto 2 de 4"`).
- **`src/ComposeV2.tsx`**: `MAX_PHOTOS = 4`; fila de miniaturas
  (92×92) com `×` de remover (`foto-tirar-{i}`), tile "foto N" de
  adicionar (`foto-add`, some no teto de 4) e preview na 1ª
  (`foto-preview`). Copy: "só local até existir endpoint" (limitação
  da API, docs/13). Estado vazio mantém a caixa tracejada original.
- **`App.tsx`**: decoração do feed passa `photos` (via `photosFor`)
  para o `FeedPhoto`.
- **`vitest.config.ts`**: stub de `useWindowDimensions` (width 390) no
  RN de teste.

## Limitação (documentada)

A API não tem campo de mídia: as fotos do compose **não vão ao
POST /reviews** (segue `cnpj + rating + comment`); posts publicados
só ganham foto quando o backend aceitar array. No feed demo, o
carrossel vem dos `photoIndexes` do mock.

## Testes

- `postPhotos.test.ts`: `photosFor` (2+, 1, e fallback por posição).
- `FeedPhoto.test.tsx` ("carrossel, docs/15"): 1 foto sem UI; 2 fotos
  → contador/dots/imagens; scroll atualiza contador; v2 mantém
  scrim/linha/nota + carrossel.
- `ComposeV2.test.tsx` ("várias fotos, docs/15"): adicionar 3
  (miniaturas + preview na 1ª), remover a 1ª (preview vira a próxima),
  teto de 4 (botão some), cancelamento não altera a fila.

Validação: `npm test` (161 testes) e `npm run typecheck` limpos.
