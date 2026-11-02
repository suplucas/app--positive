# Integração Total App ↔ API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar todas as telas do `app--positive` à `api--positive--feed`, consolidar Feed/Perfil/Avaliar na versão final e remover os seletores de UI.

**Architecture:** Fatias verticais por tela. Cada fase entrega endpoint(s) + tela + testes, com migrations aditivas e sem fallback silencioso para mock. O app passa a ter um cliente HTTP único e hooks de dados; a API ganha endpoints de restaurante, mídia, mapa, perfil, saves, comentários e notificações.

**Tech Stack:** Expo SDK 57 / React Native 0.86 / React 19 / Vitest; NestJS 12 / TypeORM / Postgres / Redis / Nominatim; react-native-webview.

**Spec:** `docs/superpowers/specs/2026-10-19-integracao-total-design.md`

## Global Constraints

- App e API são repos separados: `app--positive/` e `api--positive--feed/`.
- Nota: API armazena **0–5** com 2 casas (`NUMERIC(3,2)`); UI exibe **0–10** e envia `nota / 2`.
- Identidade: `x-user-id` obrigatório em rotas de escrita/feed/perfil; sem header → 401.
- Migrations são aditivas e idempotentes (`IF NOT EXISTS`) porque `runMigrations` roda a cada boot.
- Nominatim: `OSM_USER_AGENT` obrigatório, 1 req/s, cache; produção usa provedor pago/self-hosted via `OSM_BASE_URL`.
- App sem seletor `v1/v2`; Feed v2, Perfil v2 e Avaliar v2 são definitivos.
- Header do app: 22px, `lineHeight` 26.
- Nenhuma tela integrada pode cair em mock silencioso; erros/loadings são explícitos.
- Cada task termina com testes verdes e commit no repo correspondente.
- Rodar no app: `npm run typecheck && npm test`; na API: `npm test && npm run build`.

## Review Focus

- Escrita sem `x-user-id`: deve retornar 401 e o app nunca deve chamar sem o header.
- Upload de foto inválida/grande ou falha de storage: 400/503, sem criar review órfã.
- Resultado OSM (`osm:<tipo>/<id>`): abre o template sem chamar `/restaurants/:cnpj` e sem quebrar.
- Resultado local sem coordenadas (geocode falhou): busca e mapa lidam com `lat/lng: null`.
- Nota em passos de 0,25 na API: `NUMERIC(3,2)` preserva o valor no round-trip.

---

## Fase 0 — Consolidação visual

### Task 0.1: Feed v2 definitivo + expansão de texto

**Repo:** `app--positive`
**Files:**
- Modify: `App.tsx` (remover `feedVersion`, chips e props `variant`)
- Modify: `src/FeedPhoto.tsx` (sempre v2)
- Modify: `src/FeedQuote.tsx`, `src/FeedCard.tsx` (expansão)
- Test: `src/FeedPhoto.test.tsx`, `src/FeedCard.test.tsx`, `src/FeedQuote.test.tsx`

**Interfaces:**
- Produces: `FeedText` interno com `numberOfLines={4}` e toggle `continuar lendo`; `FeedPhoto` não recebe mais `variant`.

- [ ] Step 1: Escrever teste em `FeedQuote.test.tsx`: comentário com 200 caracteres mostra “continuar lendo”; tocar expande e o texto completo fica visível; tocar de novo recolhe.
- [ ] Step 2: Rodar `npx vitest run src/FeedQuote.test.tsx` e ver falhar.
- [ ] Step 3: Implementar o toggle (limite 180 caracteres, `numberOfLines` 4) no(s) card(s) de texto.
- [ ] Step 4: Repetir para `FeedCard.test.tsx` e `FeedPhoto.test.tsx` (v2 sempre).
- [ ] Step 5: Remover `feedVersion`/chips de `App.tsx` e `variant` de `FeedPhoto`; atualizar testes que usam `feed-v1`/`feed-v2`.
- [ ] Step 6: Rodar `npm run typecheck && npm test`; corrigir regressões.
- [ ] Step 7: Commit `feat: feed v2 definitivo com expansao de texto`.

### Task 0.2: Perfil v2 definitivo + bio abaixo do username

**Repo:** `app--positive`
**Files:**
- Modify: `src/ProfileScreen.tsx` (remover seletor e `PerfilV1`; mover bio para o bloco do username)
- Test: `src/ProfileScreen.test.tsx`

**Interfaces:**
- Produces: `ProfileScreen` sem `versao`/chips; bio renderizada dentro de `who`, abaixo do handle.

- [ ] Step 1: Ajustar teste para falhar: não existe `perfil-v1`/`perfil-v2`; a bio aparece dentro do bloco do username (ordem nome → handle → bio).
- [ ] Step 2: Rodar `npx vitest run src/ProfileScreen.test.tsx` e ver falhar.
- [ ] Step 3: Remover seletor/`VersaoChip`/`PerfilV1` e mover `<Text style={s.bio}>` para o bloco `who`.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: perfil v2 definitivo com bio abaixo do username`.

### Task 0.3: Avaliar v2 definitivo

**Repo:** `app--positive`
**Files:**
- Modify: `src/ComposeScreen.tsx` (remover seletor e caminho v1)
- Delete: código v1 e `VersaoChip`
- Test: `src/ComposeScreen.test.tsx`, `src/ComposeV2.test.tsx`

**Interfaces:**
- Produces: `ComposeScreen` renderiza `ComposeV2` diretamente; testIDs `avaliar-v1`/`avaliar-v2` deixam de existir.

- [ ] Step 1: Atualizar `ComposeScreen.test.tsx` para esperar `ComposeV2` sem chips.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Remover o seletor e o caminho v1; manter o contrato atual de `onCancel`/`onPosted`.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: avaliar v2 definitivo`.

### Task 0.4: Header 22px

**Repo:** `app--positive`
**Files:**
- Modify: `App.tsx` (`styles.word`)
- Test: `src/App.test.tsx` (novo, render leve do header)

- [ ] Step 1: Criar teste que renderiza o header e espera `fontSize: 22`, `lineHeight: 26`.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Ajustar `word`.
- [ ] Step 4: Rodar `npm run typecheck && npm test`; verificar chips/atalhos sem colisão visual.
- [ ] Step 5: Commit `feat: header das paginas em 22px`.

---

## Fase 1 — Fundação de integração

### Task 1.1: Cliente HTTP + DTOs

**Repo:** `app--positive`
**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/types.ts`
- Create: `src/api/client.test.ts`
- Modify: `src/api.ts` (usar o client)

**Interfaces:**
- Produces:
  - `apiFetch<T>(path: string, opts?: { method?; body?; userId?; signal? }): Promise<T>`
  - `ApiError { status: number; message: string }`
  - DTOs `Review`, `RestaurantProfile`, `PlaceHit`, `UserProfile`, `ReviewComment`, `AppNotification`.

- [ ] Step 1: Teste: monta `${EXPO_PUBLIC_API_URL}${path}`, envia `x-user-id`, timeout e converte resposta não-ok em `ApiError`.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar `client.ts` e `types.ts`; migrar `getFeed`/`postReview` para o client.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: cliente http e dtos compartilhados`.

### Task 1.2: Identidade de demo alinhada ao seed

**Repo:** `app--positive`
**Files:**
- Modify: `src/mockFeed.ts`, `src/SettingsScreen.tsx`, `App.tsx`
- Test: `src/SettingsScreen.test.tsx`, `src/useFeed.test.ts`

**Interfaces:**
- Produces: `DEMO_USERS = ['user_1','user_2','mogli','dosso','lucas']`; `MOCK_USER` deixa de aparecer no runtime (fixtures de teste podem importar `MOCK_FEED`).

- [ ] Step 1: Teste: configurações não mostram `mock`; `useFeed` não tem short-circuit para `mock`.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Remover `mock` do runtime e ajustar os testes que dependiam dele.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: identidade de demo alinhada ao seed da api`.

---

## Fase 2 — Feed, mídia e likes

### Task 2.1: Migration de mídia + rating

**Repo:** `api--positive--feed`
**Files:**
- Create: `scripts/migrations/005_review_media.sql`
- Modify: `src/infrastructure/entity/ReviewEntity.ts`

- [ ] Step 1: Escrever migration: `photo_url TEXT`, `review_flairs(review_id, label)` PK composta, `rating TYPE NUMERIC(3,2) USING rating::numeric`.
- [ ] Step 2: Atualizar `ReviewEntity` com `photoUrl` (coluna `photo_url`). Os flairs ficam na tabela `review_flairs` (Task 2.3).
- [ ] Step 3: Rodar `npm run build` e `npm test`.
- [ ] Step 4: Commit `feat: migration de midia e nota fracionada`.

### Task 2.2: Storage + upload de foto

**Repo:** `api--positive--feed`
**Files:**
- Create: `src/infrastructure/storage/PhotoStorage.ts` (porta + local)
- Create: `src/infrastructure/storage/PhotoStorage.spec.ts`
- Create: `src/controller/upload.ts`
- Create: `src/controller/upload.spec.ts`
- Modify: `src/app.module.ts`

**Interfaces:**
- Produces: `PhotoStorage.save(buffer, mime, ext): Promise<{ url }>`; `POST /uploads/review-photo` multipart field `file` → `{ url }`.

- [ ] Step 1: Teste do storage local: salva em `STORAGE_DIR`, devolve URL `/uploads/<arquivo>`.
- [ ] Step 2: Teste do controller: rejeita mime fora de jpeg/png/webp e > 8 MB; aceita arquivo válido.
- [ ] Step 3: Rodar e ver falhar.
- [ ] Step 4: Implementar storage/roteador/controller; servir `/uploads` estaticamente no `main.ts`.
- [ ] Step 5: Rodar `npm test && npm run build`.
- [ ] Step 6: Commit `feat: upload de foto da review com storage local`.

### Task 2.3: Review com photoUrl + flairs

**Repo:** `api--positive--feed`
**Files:**
- Create: `src/infrastructure/entity/ReviewFlair.ts`
- Modify: `src/application/service/ReviewService.ts`, `src/controller/review.ts`, `src/app.module.ts`
- Test: `src/application/service/ReviewService.spec.ts`

**Interfaces:**
- Produces: `POST /reviews` aceita `photoUrl?: string` e `flairs?: string[]` (máx. 2); `GET /feed` devolve `photoUrl` e `flairs`.

- [ ] Step 1: Teste: criar review com 2 flairs persiste ambos; com 3 rejeita; `photoUrl` volta no feed.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar entidade/serviço/controller; carregar flairs no `hydrate`.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: review com foto e flairs persistidos`.

### Task 2.4: App envia mídia e exibe no feed

**Repo:** `app--positive`
**Files:**
- Modify: `src/ComposeV2.tsx`, `src/api.ts`, `src/FeedPhoto.tsx`, `src/FeedQuote.tsx`, `src/FeedCard.tsx`
- Test: `src/ComposeV2.test.tsx`, `src/FeedPhoto.test.tsx`

**Interfaces:**
- Consumes: `POST /uploads/review-photo`, `POST /reviews` estendido.
- Produces: upload antes do publish; `photoUrl`/`flairs` renderizados.

- [ ] Step 1: Teste: publicar com foto chama upload e envia `photoUrl`; 3º flair não entra.
- [ ] Step 2: Teste: feed com `photoUrl` usa a URL remota; flairs aparecem.
- [ ] Step 3: Rodar e ver falhar.
- [ ] Step 4: Implementar envio/render; fallback para assets locais só em fixtures.
- [ ] Step 5: Rodar `npm run typecheck && npm test`.
- [ ] Step 6: Commit `feat: app envia e exibe foto e flairs da review`.

### Task 2.5: Like real no feed

**Repo:** `app--positive`
**Files:**
- Modify: `src/FeedCard.tsx`, `src/FeedQuote.tsx`, `src/FeedPhoto.tsx`, `App.tsx`
- Test: `src/FeedCard.test.tsx`

- [ ] Step 1: Teste: tocar no like chama `POST /reviews/:id/like` e incrementa o número.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar handler e atualização otimista com rollback em erro.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: like real no feed`.

---

## Fase 3 — Perfil do restaurante

### Task 3.1: Endpoint do restaurante

**Repo:** `api--positive--feed`
**Files:**
- Create: `src/controller/restaurant.ts`
- Create: `src/application/service/RestaurantService.ts`
- Create: `src/application/service/RestaurantService.spec.ts`
- Modify: `src/app.module.ts`

**Interfaces:**
- Produces: `GET /restaurants/:cnpj` → `RestaurantProfile` (contrato da spec §6).

- [ ] Step 1: Teste: 404 para CNPJ inexistente; 200 com stats agregados (`notaMedia*2`, total, queroIr, flairs, seguemAvaliaram).
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar service/controller com queries agregadas; `bairro`/`preco` = null.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: endpoint de perfil do restaurante`.

### Task 3.2: Reviews por restaurante

**Repo:** `api--positive--feed`
**Files:**
- Modify: `src/controller/restaurant.ts`, `src/application/service/RestaurantService.ts`
- Test: `src/application/service/RestaurantService.spec.ts`

**Interfaces:**
- Produces: `GET /restaurants/:cnpj/reviews?page=&limit=` → `{page, limit, results}`.

- [ ] Step 1: Teste: pagina, ordena por `createdAt DESC`, filtra por CNPJ.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: reviews paginadas por restaurante`.

### Task 3.3: App consome o restaurante real

**Repo:** `app--positive`
**Files:**
- Create: `src/api/restaurant.ts`
- Create: `src/useRestaurant.ts`
- Modify: `src/RestaurantScreen.tsx`, `src/RestaurantProfileTemplate.tsx`
- Test: `src/RestaurantScreen.test.tsx`, `src/useRestaurant.test.ts`

**Interfaces:**
- Consumes: `GET /restaurants/:cnpj`, `GET /restaurants/:cnpj/reviews`.
- Produces: `useRestaurant(cnpj)` → `{ data, reviews, status, error, refresh, loadMore }`.

- [ ] Step 1: Teste do hook: loading → data; erro → status error.
- [ ] Step 2: Teste da tela: usa dados do hook; 404 mostra estado de erro.
- [ ] Step 3: Rodar e ver falhar.
- [ ] Step 4: Implementar; remover `restaurantFor` do runtime (fixture de teste).
- [ ] Step 5: Rodar `npm run typecheck && npm test`.
- [ ] Step 6: Commit `feat: perfil do restaurante integrado a api`.

---

## Fase 4 — Busca e mapa

### Task 4.1: `/places/search` com nota/bairro local

**Repo:** `api--positive--feed`
**Files:**
- Modify: `src/application/service/PlaceService.ts`
- Test: `src/application/service/PlaceService.spec.ts`

- [ ] Step 1: Teste: resultado local inclui `notaMedia` e `municipio` como `bairro`.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar join/agregação.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: busca de lugares com nota e bairro`.

### Task 4.2: `/places` por bbox

**Repo:** `api--positive--feed`
**Files:**
- Create: `src/application/service/PlaceMapService.ts`
- Create: `src/application/service/PlaceMapService.spec.ts`
- Modify: `src/controller/place.ts`, `src/app.module.ts`

**Interfaces:**
- Produces: `GET /places?bbox=minLng,minLat,maxLng,maxLat&limit=200` → `{ results: PlacePin[] }`, só restaurantes com review e coords.

- [ ] Step 1: Teste: valida bbox/limit, filtra por coordenadas e por existência de review.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar query e controller.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: pins do mapa por bbox`.

### Task 4.3: Backfill de geocode dos restaurantes com review

**Repo:** `api--positive--feed`
**Files:**
- Create: `scripts/geocode-reviewed.mjs`
- Create: `scripts/geocode-reviewed.spec.ts` (unit do mapeamento/ritmo)
- Modify: `package.json` (script `geocode`)

- [ ] Step 1: Teste: só seleciona `lat/lng IS NULL` e com review; respeita intervalo de 1s.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar script com Nominatim e `OSM_USER_AGENT`.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: backfill de coordenadas dos restaurantes avaliados`.

### Task 4.4: App usa busca real

**Repo:** `app--positive`
**Files:**
- Create: `src/usePlaceSearch.ts`
- Modify: `src/SearchScreen.tsx`
- Test: `src/SearchScreen.test.tsx`, `src/usePlaceSearch.test.ts`

**Interfaces:**
- Consumes: `GET /places/search`.

- [ ] Step 1: Teste: busca dispara request com `q`/`lat`/`lng`; resultado OSM aparece com selo “OSM”.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar; remover `searchFilters` do runtime.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: busca integrada com fallback osm`.

### Task 4.5: App usa mapa real

**Repo:** `app--positive`
**Files:**
- Create: `src/usePlaces.ts`
- Modify: `src/MapScreen.tsx`, `src/mapHtml.ts`
- Test: `src/MapScreen.test.tsx`, `src/mapHtml.test.ts`

**Interfaces:**
- Consumes: `GET /places?bbox=...`.

- [ ] Step 1: Teste: pins vêm do hook; toque abre CNPJ; HTML recebe os pins.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar; remover `mapMock` do runtime.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: mapa integrado com pins da api`.

### Task 4.6: Perfil de resultado OSM

**Repo:** `app--positive`
**Files:**
- Modify: `src/RestaurantScreen.tsx`, `src/RestaurantProfileTemplate.tsx`
- Test: `src/RestaurantScreen.test.tsx`

- [ ] Step 1: Teste: `osm:node/1` renderiza dados do hit, `totalAvaliacoes: 0`, `reviews: []`, sem chamar `/restaurants`.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar o caminho OSM.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: perfil de resultado osm`.

---

## Fase 5 — Perfil, saves e follow

### Task 5.1: Migration e endpoint de usuário

**Repo:** `api--positive--feed`
**Files:**
- Create: `scripts/migrations/006_user_profile.sql`
- Create: `src/controller/user.ts`
- Create: `src/application/service/UserService.ts`
- Create: `src/application/service/UserService.spec.ts`
- Modify: `src/app.module.ts`

- [ ] Step 1: Teste: `GET /users/:id` devolve perfil + stats; 404 para id inexistente.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar migration/entidade/service/controller.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: perfil de usuario na api`.

### Task 5.2: Reviews do usuário

**Repo:** `api--positive--feed`
**Files:**
- Modify: `src/controller/user.ts`, `src/application/service/UserService.ts`
- Test: `src/application/service/UserService.spec.ts`

- [ ] Step 1: Teste: pagina reviews do usuário.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: reviews do usuario`.

### Task 5.3: Saves

**Repo:** `api--positive--feed`
**Files:**
- Create: `scripts/migrations/007_saves.sql`
- Create: `src/application/service/SaveService.ts`
- Create: `src/application/service/SaveService.spec.ts`
- Modify: `src/controller/user.ts`, `src/app.module.ts`

- [ ] Step 1: Teste: POST cria, DELETE remove, duplicado é idempotente/409; GET lista com resumo do restaurante.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: quero ir persistido na api`.

### Task 5.4: Follow/unfollow

**Repo:** `api--positive--feed`
**Files:**
- Modify: `src/controller/user.ts`, `src/application/service/UserService.ts`
- Test: `src/application/service/UserService.spec.ts`

- [ ] Step 1: Teste: seguir/ deixar de seguir e atualizar contadores.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: seguir e deixar de seguir`.

### Task 5.5: App perfil/saves/follow reais

**Repo:** `app--positive`
**Files:**
- Create: `src/useProfile.ts`, `src/api/user.ts`
- Modify: `src/ProfileScreen.tsx`, `src/SavedList.tsx`, `App.tsx`, `src/SettingsScreen.tsx`
- Test: `src/ProfileScreen.test.tsx`, `src/SavedList.test.tsx`

- [ ] Step 1: Teste: perfil usa dados do hook; bio abaixo do username; salvar/remover chama API.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar; remover `PERFIL`/`savedCnpjs` mock do runtime.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: perfil, saves e follow integrados`.

---

## Fase 6 — Comentários e notificações

### Task 6.1: Comentários na API

**Repo:** `api--positive--feed`
**Files:**
- Create: `scripts/migrations/008_comments.sql`
- Create: `src/infrastructure/entity/Comment.ts`
- Create: `src/application/service/CommentService.ts`
- Create: `src/application/service/CommentService.spec.ts`
- Create: `src/controller/comment.ts`
- Modify: `src/app.module.ts`

- [ ] Step 1: Teste: GET paginado por review; POST cria com `x-user-id`.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: comentarios na api`.

### Task 6.2: Notificações na API

**Repo:** `api--positive--feed`
**Files:**
- Create: `scripts/migrations/009_notifications.sql`
- Create: `src/infrastructure/entity/Notification.ts`
- Create: `src/application/service/NotificationService.ts`
- Create: `src/application/service/NotificationService.spec.ts`
- Create: `src/controller/notification.ts`
- Modify: `src/app.module.ts`

- [ ] Step 1: Teste: GET paginado por usuário; POST read marca `read_at`.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: notificacoes na api`.

### Task 6.3: App comentários reais

**Repo:** `app--positive`
**Files:**
- Create: `src/useComments.ts`
- Modify: `src/CommentThreadScreen.tsx`
- Test: `src/CommentThreadScreen.test.tsx`

- [ ] Step 1: Teste: lista do hook; enviar comentário chama POST e adiciona à thread.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar; remover `commentMock` do runtime.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: comentarios integrados`.

### Task 6.4: App notificações reais

**Repo:** `app--positive`
**Files:**
- Create: `src/useNotifications.ts`
- Modify: `src/NotificationScreen.tsx`
- Test: `src/NotificationScreen.test.tsx`

- [ ] Step 1: Teste: lista do hook; tocar marca como lida.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar; remover `notificationMock` do runtime.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: notificacoes integradas`.

---

## Fase 7 — Limpeza e verificação final

### Task 7.1: Remover mocks e código morto

**Repo:** `app--positive`
**Files:**
- Delete/limpar: `src/mockFeed.ts`, `src/mockData.ts`, `src/restaurantMock.ts`, `src/mapMock.ts`, `src/searchFilters.ts`, `src/commentMock.ts`, `src/notificationMock.ts` (ou manter só fixtures em `src/__fixtures__/`)
- Modify: imports e testes.

- [ ] Step 1: `grep` por imports de mocks no runtime; mover fixtures para `src/__fixtures__/`.
- [ ] Step 2: Remover arquivos mortos e testes obsoletos.
- [ ] Step 3: Rodar `npm run typecheck && npm test`.
- [ ] Step 4: Commit `chore: remove mocks de runtime`.

### Task 7.2: Docs, e2e e checklist final

**Repo:** app + API
**Files:**
- Modify: `app--positive/docs/16/README.md` e docs das fases
- Create/modify: `api--positive--feed/test/app.e2e-spec.ts`

- [ ] Step 1: Rodar `npm test`, `npm run build` na API e `npm run typecheck && npm test` no app.
- [ ] Step 2: Rodar `npm run test:e2e` na API.
- [ ] Step 3: Checklist manual: feed, publicar com foto/flairs, like, restaurante, mapa, busca/OSM, perfil, saves, follow, comentários, notificações.
- [ ] Step 4: Atualizar docs e commit `docs: integracao total concluida`.
