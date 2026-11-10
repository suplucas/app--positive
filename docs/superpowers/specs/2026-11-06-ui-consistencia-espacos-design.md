# Consistência de UI e espaçamento — design

**Data:** 2026-11-06
**Status:** proposta para revisão
**Repo:** `app--positive`
**Base:** auditoria de 2026-11-06. `tsc --noEmit` sem erros; 276 testes passando.

## 1. Contexto

O app já segue a identidade visual em cores, fontes e dark mode, mas a
camada de layout foi crescendo com valores soltos. Hoje há 93 usos de
`padding`/`margin`/`gap` fora da grade de 4px, 8 telas com topbars
diferentes, dois arquivos mortos e um texto de expressão JSX vazando na
busca do mapa.

A busca dentro da tela de mapa **é funcional e será mantida** (confirmado
pelo usuário). O problema ali é a seta de voltar sem handler quando a tela
é aberta como aba, além do texto literal e de estilos antigos.

## 2. Objetivo

Corrigir os 15 apontamentos da auditoria sem redesenhar o app:

1. Texto JSX vazando na busca do mapa.
2. Arquivos mortos `src/MapScreen.tsx` e `src/usePlaces.ts`.
3. Seta de voltar sem ação no mapa.
4. Espaçamento fora da grade de 4px.
5. Topbars inconsistentes.
6. Alvos de toque abaixo de 44×44.
7. Separadores de metadados inconsistentes.
8. Specs/tokens desatualizados (`blocO`, caminho de `theme.ts`).
9. Formatação de código sem padrão.
10. Cores hardcoded fora dos tokens.
11. Flair forte calculado e nunca renderizado.
12. Tipografia e raios fragmentados.
13. Estilo `searchBar` morto e bloco comentado no mapa.
14. Testes na raiz de `src` fora do módulo.
15. `App.tsx` grande demais.

## 3. Não-objetivos

- Não alterar API, banco ou contrato de dados.
- Não trocar a search bar do mapa por outra tela.
- Não redesenhar telas, componentes ou navegação.
- Não mudar copy além de separadores e correções de texto.
- Não migrar toda a tipografia para uma escala nova; só documentar e
  tokenizar os valores que já batem com os tokens.
- Não criar biblioteca de componentes; no máximo um arquivo de estilos
  compartilhados de topbar.

## 4. Decisões

### 4.1 Espaçamento: grade de 4px

- Todo `padding`, `margin` e `gap` de layout com valor >= 4 deve ser
  múltiplo de 4.
- Tokens em `src/common/theme.ts`:

```ts
spacing = {
  micro: 4,
  interno: 8,
  medio: 12,
  padrao: 16,
  grande: 20,
  secao: 24,
  bloco: 32,
}
```

- **Exceções ópticas** (permitidas, com comentário `// óptico: ...` quando
  não for óbvio): valores entre -3 e 3 usados para alinhar texto, dots de
  carrossel, badges e ícones. O overlap `marginTop: -16` do botão "+" da
  navbar também é exceção.
- **Arredondamento:** múltiplo de 4 mais próximo; empate sobe.
  `5→4`, `6/7/9→8`, `10/11/13→12`, `14→16`, `18→20`, `22→24`.
- Expressões como `spacing.interno + 2` (10) e `spacing.secao - 4` (20)
  viram o token equivalente (`spacing.medio` e `spacing.grande`).

### 4.2 Topbar compartilhada

Novo `src/common/layout.ts` exporta estilos base:

- `topbar`: linha, `gap: 8`, `paddingHorizontal: 16`,
  `paddingTop: 16`, `paddingBottom: 8`.
- `divider`: `borderBottomWidth` hairline; a cor vem da tela (`t.line`).
- `backHit`: `minWidth: 44`, `minHeight: 44`, centralizado.
- `backIcon`: `fontSize: 20`.
- `actionHit`: `minHeight: 44`, centralizado na vertical.

Telas com topbar simples (Settings, Search, UserProfile,
CommentThread, Notification) usam `layout.topbar` + `layout.divider` com
`t.line`. CommentThread e Notification mantêm o círculo escuro de 32px com
`hitSlop={6}` (44 efetivo). RestaurantProfileTemplate mantém o mesmo
círculo sobre a capa, sem divider, e usa `layout.backIcon`. MapScreen usa
`layout.topbar` com `justifyContent: 'space-between'` local, sem divider, e
mantém a seta só quando `onBack` existe, com `layout.backHit` e
`layout.backIcon`. Compose/EditProfile usam
`layout.topbar` + divider e `justifyContent: 'space-between'` local, porque
têm três itens (cancelar, título, ação); o `space-between` não entra no
token compartilhado. O botão de ação (publicar/salvar) fica com
`minHeight: 44`.

### 4.3 Alvo de toque

Qualquer botão de voltar tem área de toque mínima de 44×44, conforme
`docs/01/01-ui-ux-visual-language.md` §6. O círculo visual pode continuar
com 32px quando o `hitSlop` completa os 44px (ex.: `hitSlop={6}`);
`hitSlop` não vale como desculpa para uma área menor que 44.

### 4.4 Separadores de metadados

Regra única:

- **Texto inline** (um único `<Text>`): ` · ` entre campos.
- **Linha de nós separados**: usar `gap`, sem `·`.
- **Nunca** `·` no início de um texto.

Ajustes: remover o `·` inicial de `FeedQuote` e do banner do `App`; manter
` · ` em strings inline (mapa, busca, comentários, seção).

### 4.5 Cores e tokens

- Hex de marca só existe em `palette`.
- `#fff` → `palette.papel`.
- `#4C6027` → novo `palette.piclesInk`.
- `rgba(36,26,34,0.55)` e `rgba(36,26,34,0.82)` → `palette.overlay` e
  `palette.overlayStrong`.
- `ComposeV2` usa `t.line` na borda da caixa de foto.
- Cores de scrim/shadow sobre foto podem continuar locais, mas com nome
  claro e comentário.

### 4.6 Flair forte

- No máximo 1 flair forte por tela.
- A primeira review com `rating * 2 >= 9` recebe `strong: true`.
- `FeedCard`, `FeedQuote` e `FeedPhoto` aceitam `strong?: boolean` e
  repassam para `Flair`.
- A lógica sai de `App.tsx` para `src/feed/decorateFeed.ts`, função pura e
  testável.

### 4.7 Tipografia e raios

- Adicionar tokens `type` e `radius` em `theme.ts` e documentar em
  `docs/01/04-tokens-de-design.md`.
- Substituir apenas valores que já batem exatamente com um token.
- Meios-pixels e variações ópticas (9.5, 10.5, 11.5, 12.5, 13.5 etc.)
  ficam documentados como exceção, não são migrados em massa.

### 4.8 Busca do mapa

- A search bar permanece e fica em linha (seta, input, limpar), usada para
  encontrar restaurantes.
- A seta `‹` só renderiza quando `onBack` é passado. Na aba mapa o usuário
  volta pela navbar.
- O `×` limpa a busca e os resultados, como hoje.

## 5. Achados e critérios de aceite

| # | Achado | Correção | Critério de aceite |
|---|--------|----------|--------------------|
| 1 | Texto JSX vazando no resultado do mapa | Expressão inteira dentro de `{}` | Nenhum texto contém `hit.source` ou `?`; resultado OSM mostra `categoria · bairro · osm` |
| 2 | `src/MapScreen.tsx` e `src/usePlaces.ts` mortos | Apagar | `grep` sem imports; testes passam |
| 3 | Seta de voltar sem handler no mapa | Renderizar só com `onBack` | Sem `onBack`, não existe `testID="mapa-busca-voltar"` |
| 4 | 93 espaçamentos fora da grade | Normalizar para múltiplos de 4 + tokens 12/20 | Teste de varredura sem ocorrências |
| 5 | Topbars diferentes | `layout.topbar` compartilhado | Paddings iguais nas telas de topbar simples |
| 6 | Alvos < 44px | `layout.backHit` | Botões de voltar com 44×44 |
| 7 | Separadores inconsistentes | Regra inline vs linha | Sem `·` inicial; teste visual |
| 8 | Docs com `blocO` e caminho errado | Corrigir e completar tokens | Docs batem com `theme.ts` |
| 9 | Sem Prettier; aspas mistas | `.prettierrc` + `npm run format` | `format:check` passa |
| 10 | Cores hardcoded | `palette`/`theme` | Nenhum hex de marca em `.tsx` |
| 11 | Flair forte nunca renderizado | `decorateFeed` + prop `strong` | Máx. 1 `flair-forte` por tela |
| 12 | Fonte/raios fragmentados | Tokens + doc de exceções | Tokens documentados; valores exatos migrados |
| 13 | Estilo/bloco morto no mapa | Remover e reaproveitar `row`/`center`/`gap` | Sem `s.searchBar`; sem bloco comentado; busca em linha |
| 14 | Testes na raiz | Mover para o módulo | 4 arquivos movidos; imports ajustados |
| 15 | `App.tsx` grande | Extrair `decorateFeed` e `LayerScreen` | App sem a lógica de decoração e sem o wrapper de camada |

## 6. Riscos

- **Mudança visual:** normalizar espaçamento altera pixels. Precisa de
  conferência no emulador em claro/escuro e tela estreita (320px).
- **Diff grande de formatação:** rodar Prettier em commit separado para
  não misturar com mudanças de layout.
- **Dark mode:** toda cor substituída precisa ser lida nos dois temas.
- **Flair forte:** se mais de uma review tiver nota alta, só a primeira
  recebe o destaque; o resto continua quieto.

## 7. Critério de saída

- `npm run format:check` passa.
- `npm run typecheck` passa.
- `npm test` passa (276+ testes, incluindo os novos).
- Checklist visual: feed, busca, mapa, perfil, restaurante,
  configurações, notificações, comentários, avaliação e editar perfil,
  em claro e escuro.
