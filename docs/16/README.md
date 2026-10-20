# docs/16 — app completo (2): mapa, nova busca e seletor de nota

Pacote de features a partir do mock `docs/16/tim — app completo(2).html`.
Entregue em três commits: **mapa**, **nova busca**, **seletor de nota**.

## 1. Mapa (nova aba)

- **`src/mapHtml.ts`**: gera o HTML do Leaflet usado no `WebView` —
  tiles OSM via **MapTiler** (`backdrop-v4`/`backdrop-v4-dark`, key em
  `EXPO_PUBLIC_MAP_TILES_KEY`); sem key, cai no OSM padrão **só para
  dev**. Filtro sépia no claro, pins lambe-lambe com a nota e atribuição
  visível. Toque no pin → `postMessage({type:'open-restaurant', cnpj})`.
- **`src/mapMock.ts`**: `mapPlaces()` gera 5 lugares determinísticos
  (hash do CNPJ) a partir do seed — nome, nota (0–10), bairro,
  distância, **posição fracionária** (`x`/`y`) e **lat/lng mock** perto
  do centro do bairro (`BAIRRO_CENTERS`). Quando a API expuser endereço,
  basta trocar por coordenadas reais.
- **`src/MapScreen.tsx`**: mapa **full-bleed** (sem margem, ocupa todo
  o espaço entre header e navbar), pan/zoom livres, **sem filtro nem
  cluster** + chip flutuante “perto de você” + **bottom sheet** “nessa
  área” com o carrossel de cards (`mapa-card-{cnpj}`). Pin e card →
  `onOpenRestaurant(cnpj)`.
- **Por que WebView e não mapa nativo?** `react-native-maps` está no
  Expo Go, mas no SDK 57/Android a chave do Google Maps embutida no
  Expo Go está expirada (mapa em branco). `react-native-webview` é
  suportado no Expo Go nos dois sistemas e permite manter a identidade
  visual. Mapa nativo (`expo-maps`) fica para um dev build.
- **Nota**: os pins são geográficos, mas as coordenadas ainda são mock;
  o mapa declara “posições aproximadas”. Tiles exigem rede; sem
  Leaflet, o HTML mostra um fallback “mapa indisponível”.
- **Nota**: os pins são geográficos, mas as coordenadas ainda são mock;
  o mapa declara “posições aproximadas”. Tiles exigem rede; sem
  Leaflet, o HTML mostra um fallback “mapa indisponível”.

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

## 6. Perfil com abas (quero ir · diário · listas)

- **`src/SavedList.tsx`** (novo, extraído): linhas da lista "quero ir"
  (miniatura da capa + nome + `bairro · km` + **★ remover**;
  `salvo-linha-{cnpj}` / `salvo-tirar-{cnpj}`) + estado vazio. Sem
  ScrollView próprio (mora no perfil).
- **`src/ProfileScreen.tsx`** (v2): abas **`quero ir · N`**
  (`tab-quero-ir`) · `diário` · `listas · N`. A aba "quero ir" renderiza
  o `SavedList` (fonte: `savedCnpjs` do App). O **chip `☆ quero ir`** do
  topo foi removido.
  - Default continua **diário** (o mock abre em quero ir porque tem 6
    saves; com lista vazia, abrir no diário é melhor).
- **Removido**: `src/SavedScreen.tsx` (+ teste) e a camada no App —
  substituídos pela aba (ver revisão em `docs/10`).
- **`App.tsx`**: `savedCnpjs` → `ProfileScreen` com
  `onRemoveSaved`/`onOpenRestaurant`.

## Testes

- `src/SavedList.test.tsx`: linhas, abrir, remover, vazio.
- `src/ProfileScreen.test.tsx`: aba quero ir mostra a lista e abre o
  restaurante; aba vazia explica como salvar.
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
- `src/NoteSlider.test.tsx`: label centralizado, snap, valor ao vivo
  (e não-redisparo na mesma página).

Validação: `npm test` (186 testes) e `npm run typecheck` limpos.
