# Integração total app ↔ API — design

**Data:** 2026-10-19
**Status:** proposta para revisão
**Repos:** `app--positive` (Expo/React Native) e `api--positive--feed` (NestJS)

## 1. Contexto

O app já usa a API real para `GET /feed` e `POST /reviews`, mas a maior
parte das telas ainda depende de mocks determinísticos: restaurante,
busca, mapa, perfil, comentários, notificações e a lista “quero ir”.
A API também não expõe restaurante, perfil, comentários, notificações
nem mídia de review. O novo `GET /places/search` (OSM/Nominatim) cobre
busca por nome, mas ainda não é consumido pelo app.

Esta spec define a integração completa em fases, consolida as telas na
versão final (sem seletores `v1/v2`) e ajusta o header das páginas.

## 2. Objetivos

- Remover os seletores de UI e consolidar **Feed v2**, **Perfil v2** e
  **Avaliar v2** como versões definitivas.
- Fazer todas as telas principais lerem/escreverem na API real.
- Incluir foto e flairs nas reviews (upload + persistência).
- Aumentar o título do header de **18px para 22px**.
- Manter erros, vazios e carregamento explícitos — sem fallback
  silencioso para mock.
- Entregar em fases verticais, cada uma com API + app + testes.

## 3. Decisões de produto e UI

- **Sem seletores**: remover `feedVersion` (App), o seletor do Perfil e
  o seletor do Avaliar. Código e testes das variantes v1 saem.
- **Feed v2**: card de foto com autor/restaurante/tempo dentro da
  imagem, nota no rodapé. Cards de texto (quote e linha) ganham
  **“continuar lendo”** quando o comentário passa de **4 linhas**
  (limite determinístico: 180 caracteres); o toggle expande/recolhe no
  próprio card.
- **Perfil v2**: mantém abas, seguir e listas; a **bio passa para dentro
  do bloco do username**, abaixo do handle, como no v1.
- **Avaliar v2**: slider 0–10, foto opcional, até 2 flairs, preview.
  O envio passa a incluir `photoUrl` e `flairs`.
- **Header**: `App.tsx` `word.fontSize` 18 → 22, com `lineHeight`
  ajustado (26). Os títulos internos das sub-telas mantêm a escala
  atual.
- **Mapa**: continua full-bleed, sem filtro/cluster/rota. Pins vêm da
  API; toque abre o perfil real.

## 4. Arquitetura alvo

```
App (Expo)
  screens ──► hooks de dados ──► src/api/client.ts ──► API NestJS
     │                                                   │
     └── template de apresentação (RestaurantProfile)    ├── Postgres
                                                         ├── Redis (cache/rate limit)
                                                         └── Storage (fotos)
                                                              OSM/Nominatim (fallback)
```

- **App**: telas finas; hooks (`useFeed`, `useRestaurant`,
  `usePlaceSearch`, `useProfile`, `useComments`, `useNotifications`)
  concentram fetch, loading, erro e paginação.
- **API**: controllers finos; services por domínio; repositories
  TypeORM; storage e OSM atrás de portas.
- **Contrato**: DTOs manuais em `app/src/api/types.ts`, espelhando os
  responses da API. OpenAPI/codegen fica para depois.
- **Identidade**: `x-user-id` (POC). O usuário ativo continua em
  `App.tsx`/configurações; `mock` deixa de existir no runtime.
- **Erros**: `friendlyApiError` no app; API devolve 4xx/5xx com
  mensagem estável. Nenhuma tela troca erro por mock.
- **Storage**: porta `PhotoStorage` com `LocalPhotoStorage` (dev) e
  `S3PhotoStorage` (produção), selecionada por env.

## 5. Fases

### Fase 0 — Consolidação visual (sem API)

**Objetivo:** deixar a UI final e remover os seletores.

- App:
  - Remover `feedVersion` e os chips do header; `FeedPhoto` sempre v2.
  - Remover o seletor `perfil v1/v2`; apagar `PerfilV1`.
  - Remover o seletor `avaliar v1/v2`; apagar o caminho v1 do
    `ComposeScreen`.
  - Mover a bio do Perfil v2 para dentro do bloco do username.
  - Header 18 → 22px.
  - Expansão de texto nos cards (4 linhas / 180 caracteres + toggle).
- Testes: remover/atualizar testes dos seletores; adicionar testes da
  bio e da expansão.
- **Critério de saída:** typecheck + suíte verdes; nenhuma referência a
  `v1`/`feedVersion` no runtime.

### Fase 1 — Fundação de integração

**Objetivo:** um único caminho de dados para todas as telas.

- App:
  - `src/api/client.ts`: base URL, `x-user-id`, timeout, JSON, erros.
  - `src/api/types.ts`: DTOs de Review, Restaurant, Place, User,
    Comment, Notification.
  - Refatorar `useFeed` para o client; criar hooks base para as demais
    telas.
  - Alinhar `DEMO_USERS` ao seed da API (`user_1`…`user_20`, `mogli`,
    `dosso`, `lucas`); remover o usuário `mock` do runtime (restaurante,
    mapa, perfil e demais mocks saem nas fases seguintes).
- API: nenhum endpoint novo; padronizar erros e paginação.
- **Critério de saída:** feed e publicar funcionam via client único;
  nenhuma chamada `fetch` espalhada; suíte verde.

### Fase 2 — Feed v2 + publicar + likes + mídia

**Objetivo:** fechar o ciclo social do feed.

- API:
  - `POST /reviews` aceita `photoUrl?: string` e `flairs?: string[]`
    (máx. 2).
  - `POST /uploads/review-photo` (multipart, 1 arquivo, jpg/png/webp,
    máx. 8 MB) → `{ url }`.
  - Migration: `review.photo_url`; tabela `review_flairs`
    (`review_id`, `label`, PK composta).
  - `GET /feed` passa a devolver `photoUrl` e `flairs`.
  - Ajustar `rating` para `NUMERIC(3,2)` (passos de 0,25; API 0–5).
- App:
  - Compose v2 envia `photoUrl` e `flairs`.
  - Feed exibe foto real e flairs quando existirem.
  - Likes do feed chamam `POST /reviews/:id/like`.
- Testes: upload, validação de flairs, persistência, feed com mídia.
- **Critério de saída:** publicar com foto/flairs aparece no feed após
  refresh; likes persistem.

### Fase 3 — Perfil do restaurante

**Objetivo:** `RestaurantScreen` deixa de usar `restaurantFor`.

- API:
  - `GET /restaurants/:cnpj` → dados + stats agregados.
  - `GET /restaurants/:cnpj/reviews?page&limit` → reviews paginadas.
  - Stats: média (`AVG(rating) * 2`), total, `queroIr` (saves), flairs
    agregados, `seguemAvaliaram` (quem o usuário segue e avaliou).
  - `bairro` e `preco` não existem na tabela: retornar `null`; o app
    mostra `municipio` e omite `preco` quando ausente.
- App:
  - Container do `RestaurantScreen` busca o endpoint e injeta no
    `RestaurantProfileTemplate` (o template não muda de contrato).
  - Loading/erro/404; abrir restaurante a partir do feed e do mapa.
  - Remover `restaurantMock` do runtime (fica fixture de teste).
- **Critério de saída:** qualquer CNPJ com reviews abre o perfil real;
  reviews do banco aparecem; sem mock.

### Fase 4 — Busca + mapa

**Objetivo:** busca e pins reais, com fallback OSM.

- API:
  - `GET /places/search` já existe; devolver também `nota`/`bairro`
    quando o resultado for local.
  - `GET /places?bbox=minLng,minLat,maxLng,maxLat&limit=200` → pins de
    restaurantes **com review e coordenadas**.
  - Script de backfill `scripts/geocode-reviewed.mjs`: geocodifica uma
    vez os restaurantes com review e `lat/lng` nulos; usa
    `OSM_BASE_URL`/`OSM_USER_AGENT`, ritmo de 1 req/s e cache.
  - Produção: trocar Nominatim por provedor pago/self-hosted via env.
- App:
  - `SearchScreen` consome `/places/search`.
  - `MapScreen` consome `/places`; pins vêm da API; bottom sheet usa os
    mesmos dados.
  - Resultado OSM (id `osm:...`) abre o `RestaurantProfileTemplate` com
    os dados do hit, `totalAvaliacoes: 0`, `reviews: []` e sem chamar
    `/restaurants/:cnpj`.
  - Remover `mapMock`/`searchFilters` do runtime.
- **Critério de saída:** buscar um restaurante inexistente no cadastro
  retorna resultado OSM e abre o perfil (dados OSM, sem reviews);
  mapa mostra os lugares com review.

### Fase 5 — Perfil do usuário + quero ir + seguir

**Objetivo:** perfil e saves reais.

- API:
  - Migration `users`: `handle`, `bio` (nullable).
  - `GET /users/:id` → perfil + stats (reviews, seguidores, seguindo,
    média).
  - `GET /users/:id/reviews?page&limit`.
  - `GET /users/:id/saves`; `POST /saves/:cnpj`; `DELETE /saves/:cnpj`.
  - `POST /users/:id/follow`; `DELETE /users/:id/follow`.
- App:
  - Perfil v2 com bio abaixo do username, abas e lista “quero ir”
    vindos da API.
  - Seguir real; configurações trocam o usuário ativo.
  - Avatar por iniciais/cor (sem upload de avatar).
- **Critério de saída:** perfil, abas, saves e follow persistem entre
  sessões; nada de `PERFIL`/`savedCnpjs` mock.

### Fase 6 — Comentários + notificações

- API:
  - Migration `comments(id, review_id, user_id, text, created_at)`.
  - `GET /reviews/:id/comments`; `POST /reviews/:id/comments`.
  - Migration `notifications(id, user_id, type, actor_id, review_id,
    cnpj, read_at, created_at)`.
  - `GET /notifications`; `POST /notifications/:id/read`.
- App:
  - `CommentThreadScreen` lê/escreve comentários reais.
  - `NotificationScreen` lê notificações reais e marca como lida.
- **Critério de saída:** comentar aparece na thread; notificações vêm
  da API; mocks removidos.

### Fase 7 — Limpeza e hardening

- Remover todos os mocks/fixtures do runtime, código morto e flags.
- Atualizar docs; revisar estados de erro/vazio e acessibilidade.
- Rodar e2e (API + app), typecheck e suíte completa.
- Checklist manual: feed, publicar com foto/flairs, like, restaurante,
  mapa, busca/OSM, perfil, saves, follow, comentários, notificações.
- **Critério de saída:** integração completa; nenhuma tela principal
  usa mock.

## 6. Contratos principais

### Reviews

```ts
type Review = {
  id: number | string;
  userId: string;
  restaurantCnpj: string | null;
  rating: number | null; // API 0–5
  comment: string | null;
  likes: number;
  createdAt: string;
  photoUrl?: string | null;
  flairs?: string[];
};
```

- `GET /feed?page=&limit=` (x-user-id)
- `POST /reviews` body `{ restaurantCnpj, rating, comment, photoUrl?, flairs? }`
- `POST /reviews/:id/like`
- `GET /restaurants/:cnpj/reviews?page=&limit=`

### Restaurante

```ts
type RestaurantProfile = {
  cnpj: string;
  nome: string;
  categoria: string | null;
  bairro: string | null;
  municipio: string | null;
  preco: string | null; // null até existir no cadastro
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  notaMedia: number | null; // 0–10
  totalAvaliacoes: number;
  queroIr: number;
  flairs: { label: string; count: number }[];
  seguemAvaliaram: string[];
};
```

- `GET /restaurants/:cnpj`
- `GET /restaurants/:cnpj/reviews?page=&limit=`

### Busca e mapa

```ts
type PlaceHit = {
  id: string; // cnpj | "osm:<tipo>/<id>"
  source: 'local' | 'osm';
  nome: string;
  endereco: string | null;
  categoria: string | null;
  lat: number | null;
  lng: number | null;
  nota?: number | null;
  bairro?: string | null;
};
```

- `GET /places/search?q=&limit=&lat=&lng=`
- `GET /places?bbox=minLng,minLat,maxLng,maxLat&limit=200`

### Usuário / saves / follow

- `GET /users/:id` → `{ id, name, handle, bio, stats }`
- `GET /users/:id/reviews?page=&limit=`
- `GET /users/:id/saves`
- `POST /saves/:cnpj`, `DELETE /saves/:cnpj`
- `POST /users/:id/follow`, `DELETE /users/:id/follow`

### Comentários / notificações

- `GET /reviews/:id/comments`, `POST /reviews/:id/comments` body `{ text }`
- `GET /notifications?page=&limit=`, `POST /notifications/:id/read`

### Upload

- `POST /uploads/review-photo` multipart (`file`) → `{ url }`
- Limites: 8 MB, `image/jpeg|png|webp`.

## 7. Modelo de dados (migrations)

| Migration | Conteúdo |
|---|---|
| `005_review_media.sql` | `review.photo_url`; `review_flairs(review_id, label)`; `rating NUMERIC(3,2)` |
| `006_user_profile.sql` | `users.handle`, `users.bio` |
| `007_saves.sql` | `saves(user_id, cnpj, created_at)` PK composta |
| `008_comments.sql` | `comments` + índices por `review_id`/`created_at` |
| `009_notifications.sql` | `notifications` + índice por `user_id`/`created_at` |

Todas aditivas e idempotentes (`IF NOT EXISTS`), como as anteriores.
`004_restaurant_coords.sql` já cobre `lat/lng/geocoded_at`.

## 8. Transversais

- **Nota:** API continua em 0–5 (agora `NUMERIC(2,1)`); o app converte
  para 0–10 na exibição e divide por 2 no envio. Documentar no client.
- **Paginação:** `page`/`limit`, `limit` máximo 100; respostas
  `{ page, limit, results }` (ou `{ results }` em listas simples).
- **Erros:** 400 validação, 404 ausente, 409 conflito (save/follow
  duplicado), 429 rate limit, 5xx inesperado.
- **Cache/OSM:** manter Redis para busca/geocode; respeitar 1 req/s e
  `OSM_USER_AGENT`. Produção usa provedor pago/self-hosted.
- **Storage:** `PhotoStorage` com disco local em dev e S3-compatible em
  produção. URL pública salva em `review.photo_url`.
- **Mocks:** cada fase remove o mock da tela correspondente; testes
  usam fixtures, não o runtime.
- **Identidade:** `x-user-id` obrigatório nas rotas de escrita e no
  feed/perfil; requests sem header recebem 401.
- **Testes:** API (unitários + e2e por endpoint) e app (tela/hook) em
  cada fase; suíte completa antes de fechar a fase.

## 9. Riscos e mitigações

- **Geocoding em volume:** Nominatim público não suporta os 24k
  endereços. Mitigação: geocodificar só restaurantes com review
  (≈500) e trocar por provedor pago em produção.
- **Storage efêmero:** disco local não persiste em Railway. Mitigação:
  adapter S3-compatible obrigatório em produção.
- **Dados ausentes (`bairro`, `preco`):** o template passa a aceitar
  nulos; exibir `municipio` e omitir preço.
- **Identidade POC:** `x-user-id` é confiável; auth real fica fora do
  escopo e deve entrar antes de produção pública.
- **Contrato divergente:** DTOs manuais podem dessincronizar; testes de
  contrato por endpoint reduzem o risco.
- **Fase longa:** fatiar por tela mantém entregas pequenas; nenhuma
  fase mistura mais de um domínio.

## 10. Fora de escopo

- Autenticação real (login/senha/sessão), autorização e moderação.
- Upload de avatar e múltiplas fotos por review (uma foto agora).
- Push notifications, tempo real/websockets e offline-first.
- Recomendação/pódio por algoritmo.
- i18n e acessibilidade além do que já existe.
- Mapas nativos (dev build) — segue WebView/Leaflet.

## 11. Critérios de aceite globais

1. Nenhuma tela principal usa mock em runtime.
2. Feed, publicar (com foto/flairs), like, restaurante, mapa, busca,
   perfil, saves, follow, comentários e notificações persistem na API.
3. Header em 22px e seletores `v1/v2` inexistentes.
4. `npm run typecheck`, suíte do app, testes da API e e2e verdes.
5. Checklist manual da Fase 7 concluído.
