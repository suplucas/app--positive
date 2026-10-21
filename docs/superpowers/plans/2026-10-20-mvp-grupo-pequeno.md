# MVP Grupo Pequeno — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Endurecer o app/API para um grupo pequeno real: login, avaliar lugares do OSM, seguir usuários, feed heurístico e storage/deploy de produção.

**Architecture:** Segue a arquitetura atual. API: controllers finos em `src/controller`, regra em `src/application/service`, entidades/adapters em `src/infrastructure`; migrations aditivas em `scripts/migrations`. App: chamadas em `src/api/*`, estado de dados em hooks (`use*`), telas apresentacionais; sem lib de estado nova.

**Tech Stack:** NestJS 12 / TypeORM / Postgres / Redis / argon2 / JWT; Expo SDK 57 / RN 0.86 / React 19 / Vitest; S3-compatible (`@aws-sdk/client-s3`).

**Spec:** `docs/superpowers/specs/2026-10-20-mvp-grupo-pequeno-design.md`

## Global Constraints

- Toda mudança de banco é migration aditiva e idempotente (`IF NOT EXISTS`), com passos add → backfill → remover.
- Auth: Bearer JWT substitui `x-user-id`; públicos: `/places*`, leitura de `/restaurants/:id`. Todo o resto exige token.
- Restaurante tem `id TEXT`; seed usa `id = cnpj`; OSM usa `id = "osm:<tipo>/<id>"` e `osm_id` único.
- Feed: fórmula determinística com pesos em config; cache Redis invalidado por eventos.
- Nada de mock em runtime; fixtures só em teste.
- Rodar no app `npm run typecheck && npm test`; na API `npm test && npm run build`.

## Arquitetura — onde cada responsabilidade vive

- **Novos serviços na API** (só quando há responsabilidade nova e coesa):
  - `AuthService` — credenciais, hash, JWT, convite.
  - `FeedService` — candidatos, score, cache do feed.
  - Import de OSM entra no `PlaceService` (já é o dono de busca/lugares), não em um serviço novo.
  - `S3PhotoStorage` é adapter em `infrastructure/storage`, atrás da porta `PHOTO_STORAGE`.
- **Não criar serviço** para lógica que já tem dono: restaurante (`RestaurantService`), saves (`SaveService`), usuário/follow (`UserService`), comentários/notificações (serviços existentes) só evoluem.
- **Controllers** só validam entrada e delegam; nenhuma query/regra.
- **App**: cada domínio ganha um módulo em `src/api/*` e um hook; telas não chamam `fetch`.
- **Auth no app**: `useSession` é a única fonte do token; o cliente HTTP injeta o Bearer.

## Review Focus

- Token inválido/expirado: 401 sem detalhe técnico; app volta para login.
- Migration de `restaurantId`: nenhuma review/save/notificação órfã após o backfill.
- `POST /places/import`: dois cliques no mesmo OSM não criam dois restaurantes.
- Score com `rating`/coords ausentes: não retorna NaN nem quebra a ordenação.
- Cache do feed obsoleto após follow/save/like: invalidação acontece.

---

## Fase 1 — Auth + identidade

### Task 1.1: Migration e entidade de auth

**Repo:** `api--positive--feed`
**Files:**
- Create: `scripts/migrations/010_auth.sql`
- Modify: `src/infrastructure/entity/User.ts`
- Test: `src/application/service/AuthService.spec.ts` (criado na 1.2)

**Interfaces:**
- Produces: `User { id, name, email, passwordHash, createdAt }`.

- [ ] Step 1: Escrever a migration `users.email TEXT UNIQUE`, `users.password_hash TEXT`, `users.created_at TIMESTAMPTZ DEFAULT now()`.
- [ ] Step 2: Atualizar `User` com as colunas.
- [ ] Step 3: Rodar `npm run build`.
- [ ] Step 4: Commit `feat: migration de auth`.

### Task 1.2: AuthService

**Repo:** `api--positive--feed`
**Files:**
- Create: `src/application/service/AuthService.ts`, `src/application/service/AuthService.spec.ts`
- Modify: `package.json` (argon2 + jsonwebtoken + tipos)

**Interfaces:**
- Produces:
  - `register({email,password,name,inviteCode?}): Promise<{token,user}>`
  - `login({email,password}): Promise<{token,user}>`
  - `verify(token): Promise<{id}>`

- [ ] Step 1: Teste: email duplicado → 409; senha < 8 → 400; convite inválido → 403; login ok devolve token; senha errada → 401.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar com argon2 (fallback bcrypt) e JWT (`JWT_SECRET`, 30d); `INVITE_CODES` opcional.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: auth service`.

### Task 1.3: Guard + troca de x-user-id por Bearer

**Repo:** `api--positive--feed`
**Files:**
- Create: `src/controller/auth.ts`, `src/infrastructure/auth/AuthGuard.ts`, `src/controller/auth.spec.ts`
- Modify: todos os controllers (`review`, `upload`, `place`, `restaurant`, `user`, `save`, `comment`, `notification`), `src/app.module.ts`

**Interfaces:**
- Consumes: `AuthService`.
- Produces: `@CurrentUser()` devolve `userId`; rotas de escrita/feed/perfil/notificações exigem Bearer.

- [ ] Step 1: Teste: sem token em `POST /reviews` → 401; token válido injeta userId.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar `AuthGuard` (global com `@Public()` para places/restaurant read) e `@CurrentUser()`.
- [ ] Step 4: Substituir `@Headers('x-user-id')` em todos os controllers.
- [ ] Step 5: Rodar `npm test && npm run build`.
- [ ] Step 6: Commit `feat: auth guard e bearer`.

### Task 1.4: App login/cadastro + sessão

**Repo:** `app--positive`
**Files:**
- Create: `src/api/auth.ts`, `src/useSession.ts`, `src/LoginScreen.tsx`, `src/RegisterScreen.tsx`
- Modify: `src/api/client.ts` (Bearer), `App.tsx`, `src/SettingsScreen.tsx`
- Test: `src/useSession.test.ts`, `src/LoginScreen.test.tsx`

**Interfaces:**
- Produces: `useSession()` → `{ token, user, status, signIn, signUp, signOut }`; cliente usa `Authorization`.

- [ ] Step 1: Teste do hook: login guarda token; erro vira status.
- [ ] Step 2: Teste da tela: submit chama signIn; erro mostra copy.
- [ ] Step 3: Rodar e ver falhar.
- [ ] Step 4: Implementar com `expo-secure-store`; cliente injeta Bearer; logout nas configurações.
- [ ] Step 5: Rodar `npm run typecheck && npm test`.
- [ ] Step 6: Commit `feat: login e sessao no app`.

---

## Fase 2 — Restaurante com id próprio + import OSM

### Task 2.1: Migration `restaurants.id/source/osm_id`

**Repo:** `api--positive--feed`
**Files:**
- Create: `scripts/migrations/011_restaurant_id.sql`
- Modify: `src/infrastructure/entity/Restaurant.ts`

**Interfaces:**
- Produces: `Restaurant { id, cnpj?, source, osmId?, nomeFantasia, ... }`.

- [ ] Step 1: Migration: add `id`, `source`, `osm_id`; backfill `id = cnpj`, `source='seed'`; PK em `id`; únicos parciais em `cnpj` e `osm_id`.
- [ ] Step 2: Atualizar entidade.
- [ ] Step 3: Rodar `npm run build`.
- [ ] Step 4: Commit `feat: restaurante com id proprio`.

### Task 2.2: Migration `restaurantId` em review/saves/notifications

**Repo:** `api--positive--feed`
**Files:**
- Create: `scripts/migrations/012_restaurant_id_refs.sql`
- Modify: `src/infrastructure/entity/ReviewEntity.ts`, `Save.ts`, `Notification.ts`

- [ ] Step 1: Add colunas `restaurant_id`; backfill de `restaurantCnpj`/`cnpj`; remover colunas antigas; PK de `saves` vira `(user_id, restaurant_id)`.
- [ ] Step 2: Atualizar entidades.
- [ ] Step 3: Rodar `npm run build`.
- [ ] Step 4: Commit `feat: refs de restaurante por id`.

### Task 2.3: Services usam `restaurantId`

**Repo:** `api--positive--feed`
**Files:**
- Modify: `ReviewService`, `RestaurantService`, `PlaceService`, `PlaceMapService`, `SaveService`, `UserService`, `CommentService`, `NotificationService`
- Test: specs existentes atualizadas

**Interfaces:**
- Consumes: `restaurantId` das entidades.
- Produces: endpoints devolvem `restaurantId`.

- [ ] Step 1: Atualizar testes das services para `restaurantId`.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Trocar filtros/queries de cnpj para id.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `refactor: services por restaurantId`.

### Task 2.4: `POST /places/import`

**Repo:** `api--positive--feed`
**Files:**
- Modify: `src/application/service/PlaceService.ts`, `src/controller/place.ts`
- Test: `src/application/service/PlaceService.spec.ts`

**Interfaces:**
- Produces: `importOsm({osmId,nome,endereco,categoria,lat,lng}): Promise<{id}>`.

- [ ] Step 1: Teste: cria com `id = osm:<osmId>`; segundo import do mesmo `osmId` devolve o mesmo id.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar dedupe por `osm_id`.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: importar lugar do osm`.

### Task 2.5: App usa `restaurantId` e importa OSM no compose

**Repo:** `app--positive`
**Files:**
- Modify: `src/types.ts`, `src/api/*`, `src/ComposeV2.tsx`, `src/FeedCard.tsx`, `src/FeedQuote.tsx`, `src/FeedPhoto.tsx`, `App.tsx`
- Test: `src/ComposeV2.test.tsx`, `src/FeedCard.test.tsx`

**Interfaces:**
- Consumes: `POST /places/import`, `Review.restaurantId`.

- [ ] Step 1: Teste: escolher resultado OSM chama import e publica com o id retornado.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Compose busca `/places/search`; renomear `restaurantCnpj` → `restaurantId` no app.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: compose importa osm e usa restaurantId`.

---

## Fase 3 — Perfil de outro usuário + seguir

### Task 3.1: `isFollowing` no perfil

**Repo:** `api--positive--feed`
**Files:**
- Modify: `src/application/service/UserService.ts`, `src/controller/user.ts`
- Test: `src/application/service/UserService.spec.ts`

- [ ] Step 1: Teste: perfil de outro usuário devolve `isFollowing` do viewer.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar consulta em `follows`.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: isFollowing no perfil`.

### Task 3.2: `UserProfileScreen` + navegação

**Repo:** `app--positive`
**Files:**
- Create: `src/UserProfileScreen.tsx`, `src/useUserProfile.ts`
- Modify: `App.tsx`, `src/FeedCard.tsx`, `src/FeedQuote.tsx`, `src/FeedPhoto.tsx`, `src/CommentThreadScreen.tsx`, `src/NotificationScreen.tsx`
- Test: `src/UserProfileScreen.test.tsx`

- [ ] Step 1: Teste: perfil de outro usuário mostra stats/reviews e seguir chama API.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar tela/hook e navegação pelo autor.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: perfil de usuario e seguir`.

---

## Fase 4 — Feed heurístico

### Task 4.1: `FeedService` (score + candidatos)

**Repo:** `api--positive--feed`
**Files:**
- Create: `src/application/service/FeedService.ts`, `src/application/service/FeedService.spec.ts`
- Modify: `src/app.module.ts`

**Interfaces:**
- Produces: `score(review, ctx): number` e `rank(candidates, ctx): FeedReview[]`.

- [ ] Step 1: Teste: fórmula com pesos; autor seguido vence conteúdo global; sem rating/coords não quebra; restaurante salvo ganha afinidade.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar a fórmula da spec §5 com pesos em config.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: score do feed`.

### Task 4.2: Integrar no `ReviewService` + cache + `feed_read`

**Repo:** `api--positive--feed`
**Files:**
- Modify: `src/application/service/ReviewService.ts`
- Test: `src/application/service/ReviewService.spec.ts`

- [ ] Step 1: Implementar o log estruturado `feed_read` (branch/full/partial/empty) para os 3 testes existentes.
- [ ] Step 2: Rodar e ver os 3 testes passarem.
- [ ] Step 3: Teste: cache do feed invalidado em follow/save/like.
- [ ] Step 4: Integrar `FeedService.rank` no `findFeed` e invalidar `feed:<user>` nos eventos.
- [ ] Step 5: Rodar `npm test && npm run build`.
- [ ] Step 6: Commit `feat: feed ranqueado e cache`.

---

## Fase 5 — Produção + acabamento

### Task 5.1: `S3PhotoStorage`

**Repo:** `api--positive--feed`
**Files:**
- Create: `src/infrastructure/storage/S3PhotoStorage.ts`, `S3PhotoStorage.spec.ts`
- Modify: `src/app.module.ts`, `.env.example`

**Interfaces:**
- Produces: `PHOTO_STORAGE` escolhe local ou S3 por env.

- [ ] Step 1: Teste: com `S3_BUCKET` usa S3; sem, local.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar com `@aws-sdk/client-s3`.
- [ ] Step 4: Rodar `npm test && npm run build`.
- [ ] Step 5: Commit `feat: storage s3`.

### Task 5.2: Estados vazios/onboarding

**Repo:** `app--positive`
**Files:**
- Modify: `App.tsx`, `src/SearchScreen.tsx`, `src/ProfileScreen.tsx`, `src/UserProfileScreen.tsx`
- Test: telas correspondentes.

- [ ] Step 1: Testes de feed vazio, perfil sem reviews, busca sem resultado e “quero ir” vazio.
- [ ] Step 2: Rodar e ver falhar.
- [ ] Step 3: Implementar copies e CTAs.
- [ ] Step 4: Rodar `npm run typecheck && npm test`.
- [ ] Step 5: Commit `feat: estados vazios do mvp`.

### Task 5.3: Docs, env e verificação final

**Repo:** app + API
**Files:**
- Modify: `app--positive/docs/17/README.md`, `api--positive--feed/README.md`, `.env.example`

- [ ] Step 1: Documentar auth, import OSM, feed e env de produção.
- [ ] Step 2: Rodar `npm run typecheck && npm test` no app e `npm test && npm run build` na API.
- [ ] Step 3: Smoke e2e básico da API (`/auth/register`, `/feed` autenticado).
- [ ] Step 4: Commit `docs: mvp grupo pequeno`.
