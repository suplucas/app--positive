# docs/16 — app completo (2): mapa, nova busca e seletor de nota

Pacote de features a partir do mock `docs/16/tim — app completo(2).html`.
Entregue em três commits: **mapa**, **nova busca**, **seletor de nota**.

## 1. Mapa (nova aba)

- **`src/mapMock.ts`**: `mapPlaces()` gera 5 lugares determinísticos
  (hash do CNPJ) a partir do seed — nome, nota (0–10), bairro,
  distância, **posição fracionária** (`x` 0.14–0.85, `y` 0.18–0.72) e
  **cor pela faixa de nota** (`>=8.5` mostarda · `>=6.5` lambe-lambe ·
  senão picles). Sem SDK de mapa.
- **`src/MapScreen.tsx`**:
  - `perto de você` → moldura estilizada (`mapa-moldura`): manchas de
    bairro translúcidas (sem lib de gradiente), **ponto "você"** escuro
    (`mapa-voce`) e **pins** gota coloridos com a nota
    (`mapa-pin-{cnpj}`).
  - `nessa área` → carrossel horizontal de cards (cor + nota, nome,
    `bairro · km`, `mapa-card-{cnpj}`).
  - Pin e card → `onOpenRestaurant(cnpj)` (página do restaurante em
    camada).
  - Rodapé: protótipo visual; mapa real usaria Google Maps/Mapbox.

## 2. Navbar: `mapa` no lugar de `notif.`

O mock troca o item da navbar. Agora: **feed · buscar · + · mapa ·
perfil**. As **notificações (docs/09)** não ficam órfãs — ganharam um
atalho **♡ (sino)** na linha do perfil (`abrir-notificacoes`), abertas
como **camada** (`LayerScreen`) sobre o perfil, com botão voltar.

## 3. Bug corrigido no caminho

`src/restaurantMock.ts` usava shift com sinal (`>>`) em campos de
faixa, o que podia gerar valores **negativos** (ex.: `distanciaKm` =
-2.2, mostrando "a -2.2km de você" na página do restaurante). Trocado
por `>>>` em rating/likes/createdAt/distância/bairro/preço/flairs.

## 4. Nova busca (rework da tela `docs/08`)

- **`src/searchFilters.ts`**: `SEARCH_FILTERS` (os 4 chips do mock) +
  `searchWithFilter(query, filter, limit=8)` — base textual do seed;
  `perto` ordena por `distanciaKm`, `avaliados` por `notaMedia`,
  `seguidos` é um subset determinístico (hash par). Trocar por
  PostGIS/pg_trgm quando existir backend.
- **`src/SearchScreen.tsx`** (novo layout):
  - header com **voltar** (`busca-voltar`) + input (placeholder
    "Buscar restaurante, bairro, tipo de comida…");
  - **chips** `todos / perto de mim / mais bem avaliados / seguidos já
    foram` (`busca-chip-{id}`, ativo = fundo ink);
  - linhas com **miniatura** (cor da capa), nome, meta
    `categoria · bairro · preço` e **nota** à direita
    (`busca-hit-{cnpj}`);
  - **modo picker**: com `onPick`, escolher devolve o hit (para a
    avaliação) em vez de abrir a página.
- **Fluxo "trocar" (docs/16)**: o "trocar" do compose v2 abre a busca
  como **camada picker** (`onChangePlace` → `composePickedCnpj`);
  escolher preenche o local e volta pra avaliação. O campo inline do
  compose continua pro caso "nada selecionado".

## 5. Seletor de nota (ajuste ao mock)

- **`src/NoteSlider.tsx`**:
  - **snap real** nos ticks (`snapToInterval={TICK_W}`,
    `snapToAlignment="center"`, `decelerationRate="fast"`) — antes só
    corrigíamos no fim do momentum;
  - **valor grande acompanha o scroll ao vivo** (`onScroll`,
    `scrollEventThrottle=16`), disparando onChange só quando a página
    muda (como o mock);
  - **rótulo "nota" centralizado** (`nota-label`) agora vive dentro do
    slider.
- **`src/ComposeV2.tsx`**: removeu o `SectionTitle` "nota" (o rótulo
  centralizado veio pro slider).

## Testes

- `src/searchFilters.test.ts`: 4 filtros, limite/textual, ordenação
  (distância/nota) e subset determinístico.
- `src/SearchScreen.test.tsx`: chips, textual, meta + nota, navegar,
  **picker** (`onPick`), filtro "mais bem avaliados", vazio, voltar.
- `src/ComposeV2.test.tsx`: "trocar" chama `onChangePlace`; `pickedCnpj`
  preenche o local.
- `src/mapMock.test.ts`: 4–6 lugares, determinístico, posições na
  moldura, cor da paleta.
- `src/MapScreen.test.tsx`: seções + ponto "você", pin e card por
  lugar, pin mostra a nota e abre o restaurante, card abre, rodapé.
- `src/NotificationScreen.test.tsx`: botão voltar (camada).
- `src/ProfileScreen.test.tsx`: sino só com callback.

Validação parcial: `npm test` (172 testes) e `npm run typecheck`.
