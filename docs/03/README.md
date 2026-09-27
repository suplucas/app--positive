# docs/03 — Telas do app (feed + perfil)

Implementação em HTML das telas de **feed** e **perfil** do "tim", replicando fielmente
os estilos, tokens e componentes de `tim — app (feed + perfil)(1).html`.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `feed.html` | Tela de feed — HTML autônomo, mobile (max 400px), tema claro/escuro |
| `perfil.html` | Tela de perfil — HTML autônomo, mobile (max 400px), tema claro/escuro |
| `index.html` | Visualização lado a lado das duas telas (iframes 400px) |

## Como abrir

```bash
# Direto no navegador
xdg-open docs/03/index.html     # Linux
open docs/03/index.html         # macOS

# Ou sirva localmente (recomendado para iframes/fontes)
npx serve docs/03
```

A navegação entre as telas funciona via links reais na navbar
(feed ↔ perfil). O botão 🌙/☀️ no header alterna o tema.

## Estilos replicados do arquivo de referência

### Tokens

| Token | Valor |
|-------|-------|
| `--bg` | `#FBF2E4` (papel) |
| `--ink` | `#241A22` (berinjela) |
| `--sub` | `rgba(36,26,34,0.58)` |
| `--mustard` | `#F2A93B` |
| `--pink` | `#E63E75` |
| `--pickle` | `#7A9A3D` |
| `--line` | `rgba(36,26,34,0.10)` |

### Tipografia
- **Display:** Bricolage Grotesque (500/700/800) — `.disp`
- **Corpo:** Instrument Sans (400/500/600)

### Componentes
- **Feed:** pódio "top da semana" (placas 96/76/60px, mostarda/pink/picles);
  quote card (frase forte, fundo de marca, raio 16px); post com foto
  (edge-to-edge, 220px, nota sobre a imagem); lista compacta (avatar 32px, nota à direita).
- **Perfil:** bio-block (avatar 64px), stats em linha, estante de favoritos
  (quadrados aspect-ratio 1) e grade de diário 3 colunas com `grid-auto-flow:dense`
  e células `quote wide` (span 2).

### Dark mode
Fundo neutro `#121212` (nunca berinjela), texto `#F2F0EF`. Detecta
`prefers-color-scheme` e pode ser forçado com o atributo `data-theme`
no `<html>` (o botão do header faz isso).

## Próximos passos

- Levar a decisão de layout escolhida para os componentes React Native
  (`src/FeedCard.tsx`, `src/ProfileScreen.tsx`, `src/Podium.tsx`).
- Documentar estados de loading/erro/vazio nos mockups.

## Status da implementação (React Native) — feed + perfil

Portado para o app Expo espelhando os HTMLs desta pasta:

| Mockup (docs/03) | Componente RN | Observações |
|---|---|---|
| Pódio "top da semana" | `src/Podium.tsx` | placas 96/76/60px, mostarda/lambe-lambe/picles |
| Quote card (frase forte) | `src/FeedQuote.tsx` | **novo** — fundo de marca, raio 16, nota + restaurante |
| Lista compacta | `src/FeedCard.tsx` | inalterado (avatar, nota à direita, meta) |
| Post com foto | `src/FeedPhoto.tsx` | **novo** — mídia edge-to-edge 220px, nota sobre a imagem, legenda e ações |
| Estante de favoritos | `src/ProfileScreen.tsx` | quadrados aspect-ratio 1 + `NoteBadge chip` |
| Grade de diário (3 col) | `src/ProfileScreen.tsx` | `flexWrap` 3 colunas; células `quote` largas (span ~2) |
| Navbar inferior | `src/Navbar.tsx` | ativo peso 600 / inativo 50% |

**Regra de negócio do feed:** `Review.layout` fixa o formato no feed mock
(foto / quote / linha). Sem ele (feed real), o `App` deriva: foto pela regra
de índice, quote para nota ≥ 9, senão linha; os tons das quote cards alternam
mostarda ↔ lambe-lambe (`App.tsx` → `decorated`).

**Fotos:** as imagens locais de `assets/posts/` são distribuídas por
índice em `src/postPhotos.ts` (uma a cada 4 posts, alternando), já que o
modelo de dados (`Review`) ainda não tem mídia. Quando a API passar a
devolver a foto, basta ler do review em vez do índice.

**Usuário `mock` (feed local):** adicionado ao seletor de usuários do topo.
Selecioná-lo mostra um feed 100% local — **não chama o backend**
(`useFeed` faz short-circuit em `MOCK_USER`; `refresh`/`loadMore` são
no-op). Para voltar ao feed real, é só escolher outro usuário.

O feed mock reproduz o mix de cards do mock HTML desta pasta: **2 posts com
foto** (layout `photo`, imagens de `assets/posts`), **2 quote cards** textuais
(`quote`) e **2 linhas compactas** (`row`). Dados em `src/mockFeed.ts`; o
campo `Review.layout` fixa o formato (a API não envia), e o `App` cai na
regra derivada quando ele não existe.

Validação: `npm test` (55 testes) e `npm run typecheck` limpos.

> Perfil v2 (botão seguir, abas diário/listas, fotos reais) está em `docs/04`.

