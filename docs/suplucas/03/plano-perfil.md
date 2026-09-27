# docs/02 — exploração de layout da tela de perfil

## Objetivo

A tela de perfil atual (v1) fixou uma solução única: estante de favoritos + grade de diário, estilo Letterboxd. Este documento abre a exploração de **outras disposições de informação**, mantendo os tokens de marca já definidos (cor, tipografia, espaçamento, princípio de dark mode) fixos — a variável aqui é só a estrutura, não o estilo.

## Restrições fixas (não mudam entre variantes)

- Paleta: berinjela `#241A22`, papel `#FBF2E4`, mustarda `#F2A93B`, pink `#E63E75`, picles `#7A9A3D`
- Tipografia: Bricolage Grotesque (display) + Instrument Sans (corpo)
- Dark mode neutro (`#121212`), cor de marca só em pontos
- Espaçamento em escala de 4px
- Navbar inferior com "perfil" ativo

## Variantes a explorar

| # | Nome | Disposição da informação | Hipótese / quando funciona bem |
|---|---|---|---|
| A | **Lista** | Header simples + stats em linha + lista textual de reviews (sem grid, sem foto grande) | Foco em conteúdo/opinião, não em identidade visual — bom se o app quiser parecer mais "crítico sério" que "rede social" |
| B | **Grid de posts** | Header + bio curta + grid 3 colunas de fotos com nota sobre a imagem (estilo Instagram/diário) | Foco em volume e escaneabilidade visual — bom se foto for o carro-chefe do conteúdo |
| C | **Minimalista (só username)** | Avatar pequeno, username, uma linha de bio, estatísticas — sem prévia de conteúdo abaixo, um botão "ver avaliações" leva pra lista à parte | Foco em identidade rápida — bom pra perfil de terceiros que você está checando rápido antes de seguir |
| D | **Com foto de capa** | Capa larga no topo (hero), avatar sobreposto, bio, depois conteúdo | Mais "editorial"/personalizável — bom se o app quiser dar mais expressão de identidade a cada usuário, mas adiciona peso visual |

## Critérios de avaliação (pra decidir depois)

1. **Tempo até a primeira informação útil** — quantos scrolls/segundos até o visitante entender "essa pessoa vale seguir?"
2. **Custo de conteúdo pro usuário novo** — variantes que dependem de grid de fotos ficam vazias pra quem começou agora; lista textual degrada melhor com pouco conteúdo.
3. **Coerência com o feed** — se o feed é texto-primeiro (decisão já tomada), um perfil 100% fotográfico (variante B) pode destoar.
4. **Peso de implementação** — capa (D) exige upload/crop de imagem extra que as outras não exigem.

## Próximos passos

- Visualizar as 4 variantes lado a lado no HTML anexo (`perfil-variantes.html`), alternando por abas.
- Coletar reação/preferência antes de escolher uma direção definitiva.
- Depois de decidir, atualizar `identidade-visual.html` e `app-mobile.html` pra refletir a variante escolhida, e arquivar as descartadas aqui como referência histórica.
