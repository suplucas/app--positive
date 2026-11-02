# MVP para grupo pequeno — design

**Data:** 2026-10-20
**Status:** proposta para revisão
**Repos:** `app--positive` (Expo/React Native) e `api--positive--feed` (NestJS)
**Base:** integração total já entregue (`docs/17`), agora endurecida para uso real por um grupo pequeno e fechado.

## 1. Contexto

O app já fala com a API em feed, restaurante, busca/mapa, perfil, saves,
comentários e notificações. O que falta para um grupo pequeno usar de
verdade é: **identidade real** (hoje `x-user-id` de POC), **avaliar
lugares que só existem no OSM**, **seguir usuários pela UI**, um
**algoritmo de feed** e **infra de produção** (foto em storage
persistente e deploy).

## 2. Objetivos do MVP

- Pessoas reais entram com **email + senha** e têm sua própria conta.
- Post completo: nota, comentário, foto e flairs (já existe).
- Marcar restaurante com **busca na API + fallback OSM**, podendo
  **importar e avaliar** o lugar encontrado.
- **Seguir/deixar de seguir** com perfil de outro usuário.
- **Salvar restaurantes** e ver “quero ir”.
- **Feed com algoritmo heurístico** por sinais, explicável e testável.
- Curtir, comentar e notificações in-app.
- Rodar hospedado para um grupo pequeno, com storage de foto
  persistente.

## 3. Não-objetivos

- Push notifications, offline, i18n, moderação, avatar, múltiplas fotos.
- Recomendação por ML/embeddings.
- Listas curadas e favoritos (sem endpoint; fora do MVP).
- Autenticação social (Google/Apple).

## 4. Decisões

- **Auth:** email + senha, hash argon2id (fallback bcrypt), JWT de
  acesso com expiração de 30 dias. Cadastro exige **código de convite**
  quando `INVITE_CODES` estiver configurado.
- **Identidade na API:** `Authorization: Bearer <jwt>` substitui
  `x-user-id`. Um guard resolve `req.user.id`; exigem token: feed,
  escrita (reviews/likes/comments/saves/follow/upload), perfil do
  usuário e notificações. Seguem públicos: busca de lugares, listagem
  do mapa e leitura de restaurante.
- **Restaurante com id próprio:** `restaurants.id` (TEXT) passa a ser a
  chave; CNPJ vira atributo único opcional. Lugares do OSM entram com
  `id = "osm:<tipo>/<id>"`, `source='osm'` e `osm_id` para dedupe.
- **Feed:** score heurístico determinístico (seção 6), sem ML.
- **Storage:** adapter S3-compatible em produção; disco local em dev.
- **Deploy:** API + Postgres + Redis hospedados (Railway/Fly); app via
  Expo dev build para o grupo.

## 5. Fases

### Fase 1 — Auth + identidade

**API**
- Migration `010_auth.sql`: `users.email TEXT UNIQUE`,
  `users.password_hash TEXT`, `users.created_at`.
- `POST /auth/register` `{ email, password, name, inviteCode? }`
  → `{ token, user }`; valida email, senha ≥ 8, convite.
- `POST /auth/login` `{ email, password }` → `{ token, user }`.
- `GET /auth/me` (Bearer) → `user`.
- Guard global de auth; `@CurrentUser()` no lugar de
  `@Headers('x-user-id')`.
- Rate limit básico em login/register (ex.: 10/min por IP).

**App**
- `src/api/auth.ts`, `useSession` (token em `expo-secure-store`).
- Telas `LoginScreen` e `RegisterScreen`; logout nas configurações.
- Cliente HTTP injeta `Authorization`; remove `x-user-id`.

**Critério de saída:** duas contas criadas, login, feed por usuário
autenticado, escrita sem token → 401.

### Fase 2 — Importar OSM + compose via API

**API**
- Migration `011_restaurant_id.sql`:
  - `restaurants`: `id TEXT`, `source TEXT DEFAULT 'seed'`,
    `osm_id TEXT`; backfill `id = cnpj`; PK em `id`; únicos em
    `cnpj`/`osm_id` (quando não nulos).
  - `review`, `saves`, `notifications`: `restaurantId TEXT`; backfill
    de `restaurantCnpj`/`cnpj`; depois remover as colunas antigas.
    Em `saves`, a PK composta passa a ser `(user_id, restaurantId)`.
- `POST /places/import` `{ osmId, nome, endereco, categoria, lat, lng }`
  → `{ id }`; dedupe por `osm_id`; cria `source='osm'`.
- `/places/search`, `/places`, `/restaurants/:id`,
  `/restaurants/:id/reviews`, `/feed` passam a usar `id`.
- `GET /users/:id/saves` devolve `id` do restaurante.

**App**
- Compose busca em `/places/search` (com debounce) e mostra resultados
  locais e OSM.
- Selecionar OSM chama `POST /places/import` e guarda o `id` retornado.
- `Review.restaurantCnpj` vira `restaurantId` em todo o app; navegação
  e cards usam `id`.

**Critério de saída:** buscar um lugar inexistente, importar e publicar
uma review nele; o feed e o perfil mostram a review.

### Fase 3 — Perfil de outro usuário + seguir

**API**
- `GET /users/:id` inclui `isFollowing` do viewer autenticado.
- `POST/DELETE /users/:id/follow` já existem; notificam (já existe).

**App**
- `UserProfileScreen` (`useUserProfile`) com stats, reviews e botão
  seguir/seguindo.
- Navegação para o perfil ao tocar no autor (feed, comentários,
  notificações).
- O próprio perfil segue sem botão.

**Critério de saída:** seguir um usuário, ver a contagem subir e o feed
dele passar a influenciar o seu.

### Fase 4 — Feed heurístico

**API**
- `FeedService` calcula candidatos e score; `GET /feed` ordena por
  score e devolve `score`/`reasons` opcionais.
- Cache Redis por usuário (`feed:<userId>:scored`), invalidado por
  eventos de review/like/follow/save; fallback de cálculo síncrono.
- Implementar o log estruturado `feed_read` (resolve os 3 testes
  pendentes de `ReviewService.spec.ts`).

**Fórmula (pesos em config):**

```
score = 0.40*social + 0.25*affinity + 0.15*quality + 0.15*recency + 0.05*proximity
```

- `social`: 1 se o autor é seguido; 0.3 se é conteúdo global.
- `affinity`: 1 se o restaurante está salvo; 0.5 se você curtiu outra
  review do mesmo lugar; 0 caso contrário.
- `quality`: `rating/5` (0–5), 0.5 quando ausente.
- `recency`: `1 / (1 + diasDesdePublicacao / 7)`.
- `proximity`: `1 - min(distanciaKm, 10)/10`, 0.5 quando desconhecida.

**Critério de saída:** testes de unidade da fórmula; feed muda de ordem
conforme seguir/salvar/curtir; cache invalidado.

### Fase 5 — Produção + acabamento

- `S3PhotoStorage` (`@aws-sdk/client-s3`) atrás da porta `PHOTO_STORAGE`;
  env `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`,
  `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`.
- Deploy da API (Railway/Fly) com Postgres + Redis; app via Expo dev
  build; `EXPO_PUBLIC_API_URL` apontando para produção.
- Estados vazios/onboarding: feed novo, perfil sem reviews, busca sem
  resultado, “quero ir” vazio.
- Limpeza: remover mocks/fixtures restantes do runtime, atualizar docs,
  rodar suíte e2e básica.

**Critério de saída:** dois celulares do grupo usando o app hospedado,
com foto persistindo e feed personalizado.

## 6. Contratos principais

### Auth

```ts
type AuthResponse = { token: string; user: { id: string; name: string; email: string } };
```

- `POST /auth/register` `{ email, password, name, inviteCode? }`
- `POST /auth/login` `{ email, password }`
- `GET /auth/me` (Bearer)

### Lugares

- `POST /places/import` `{ osmId, nome, endereco, categoria, lat, lng }` → `{ id }`
- `GET /places/search?q=&lat=&lng=`
- `GET /places?bbox=&limit=`

### Feed

```ts
type FeedReview = Review & { score?: number; reasons?: string[] };
```

- `GET /feed?page=&limit=` (Bearer)

### Usuário

- `GET /users/:id` → `UserProfile & { isFollowing: boolean }`
- `GET /users/:id/reviews`, `GET /users/:id/saves`
- `POST/DELETE /users/:id/follow`, `POST/DELETE /saves/:id`

## 7. Migrations

| Migration | Conteúdo |
|---|---|
| `010_auth.sql` | `users.email`, `users.password_hash`, `users.created_at` |
| `011_restaurant_id.sql` | `restaurants.id/source/osm_id`; `review/saves/notifications.restaurantId`; backfill e índices |

Todas aditivas e idempotentes; a troca de coluna é feita em passos
(adicionar → backfill → remover) para permitir rollback.

## 8. Riscos e mitigações

- **Refatorar `cnpj` → `id`:** toca feed, restaurante, saves e
  notificações. Mitigação: migration em passos, backfill testado e
  `id = cnpj` para o seed (comportamento idêntico no catálogo atual).
- **Dados insuficientes para o algoritmo:** em grupo pequeno o score
  pode parecer aleatório. Mitigação: baseline de qualidade/recência
  forte e conteúdo global para preencher o feed.
- **Segurança do auth:** senha/JWT exigem rate limit, expiração e
  segredo forte (`JWT_SECRET`); sem isso não vai para produção.
- **OSM duplicado:** dedupe por `osm_id`; nomes próximos podem gerar
  dois registros — aceitável no MVP.
- **Nominatim em produção:** continua só para backfill/dev; busca em
  produção usa o catálogo + cache.

## 9. Critérios de aceite globais

1. Login real funcionando e rotas exigindo Bearer.
2. Post completo em restaurante do catálogo **ou** importado do OSM.
3. Seguir/deixar de seguir com perfil de outro usuário.
4. Salvar restaurante persistindo.
5. Feed com score heurístico, cache e testes.
6. Foto persistindo em storage de produção.
7. `npm run typecheck`, suítes do app e da API verdes (incluindo os 3
   testes `feed_read`); e2e básica da API.
