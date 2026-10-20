# docs/17 — Integração total app ↔ API

Implementação da spec `docs/superpowers/specs/2026-10-19-integracao-total-design.md`
e do plano `docs/superpowers/plans/2026-10-19-integracao-total.md`.

## Entregue

- **UI final**: Feed v2, Perfil v2 e Avaliar v2, sem seletor `v1/v2`.
  Header das páginas em **22px**; bio do perfil abaixo do username.
- **Feed**: `GET /feed` + `POST /reviews` com `photoUrl` e `flairs`
  (até 2); upload em `POST /uploads/review-photo`; like real com
  atualização otimista.
- **Restaurante**: `GET /restaurants/:cnpj` e
  `GET /restaurants/:cnpj/reviews`; `RestaurantScreen` virou container
  e o template recebe os dados.
- **Busca/mapa**: `GET /places/search` (fallback OSM quando o nome não
  está no cadastro) e `GET /places?bbox=` para os pins; mapa full-bleed
  com pins da API.
- **Perfil/saves/follow**: `GET /users/:id`, reviews do usuário,
  `GET/POST/DELETE /saves` e follow/unfollow; perfil usa stats/bio da
  API e a aba “quero ir” lê os saves persistidos.
- **Comentários/notificações**: endpoints reais; telas consomem a API.
- **Migrations**: `004`–`009` (coords, mídia/rating, perfil, saves,
  comentários, notificações). `npm run geocode` faz o backfill dos
  restaurantes avaliados.

## Variáveis de ambiente

App (`.env`):

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_MAP_TILES_KEY=            # opcional em dev (fallback OSM)
```

API:

```bash
OSM_USER_AGENT=tim-app/0.1 (seu@email)
OSM_BASE_URL=https://nominatim.openstreetmap.org
STORAGE_DIR=uploads                   # produção: trocar por S3
```

## Limitações conhecidas / próximo passo

- **Busca do app**: agora é API-only (`/places/search`), com debounce e
  resultados locais + OSM. O compose ainda usa o catálogo local para o
  campo de local.
- **Perfil**: stats, bio, diário (reviews da API), saves e follow
  existem; favoritos e listas foram removidos por falta de endpoint. O
  botão seguir fica oculto no próprio perfil (não há tela de outro
  usuário ainda).
- **Mapa**: os pins vêm de `GET /places` (restaurantes com review e
  coordenadas). Rode `npm run geocode` na API para popular o backfill.
- **Auth**: `x-user-id` segue como identidade de POC; não há
  autenticação real.
- **Nominatim**: público apenas em dev; produção exige provedor
  pago/self-hosted (`OSM_BASE_URL`).
- **Notificações**: endpoints e produtores de like/follow/comment
  existem; a lista começa vazia até essas ações acontecerem.
- **Testes da API**: os 3 testes de `feed_read` em
  `ReviewService.spec.ts` continuam vermelhos; eles já estavam
  modificados no working tree antes desta integração e cobrem um log
  que o `ReviewService` ainda não emite.

## Validação

- App: `npm run typecheck`, `npm test` (216 testes) e
  `npx expo export --platform android`.
- API: `npm test` (61 testes novos/verdes; 3 falhas pré-existentes
  acima) e `npm run build`.
