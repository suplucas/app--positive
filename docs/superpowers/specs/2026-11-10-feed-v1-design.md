# Feed v1 — design

**Data:** 2026-10-11 (corrigido em 2026-11-10)
**Status:** proposta para revisão
**Repos:** `app--positive` (branch `main`) e `api--positive--feed` (branch `master`)
**POC de referência:** `app--positive/docs/final_feed/feed-v1.html`
**Baseline:** `tsc --noEmit` limpo no app; 278/280 testes passando (2 falhas conhecidas:
`spacing-usage.test.ts` e `decorateFeed.test.ts`, ambas em código que esta spec reescreve).
Na API, `PlaceService.spec.ts` tem 6 falhas vindas de trabalho não commitado (fallback
Photon) — fora do escopo desta spec.

## 1. Contexto

O POC `feed-v1.html` define a versão final do feed: **2 tipos de post** (com foto e
quote/card), painel de notificações rico aberto pelo coração do header, tela de post
expandido, tab bar flutuante que encolhe no scroll e toggle de tema no header.

O app Expo já tem feed funcional (`FeedPhoto`, `FeedQuote`, `FeedCard`, `useFeed`,
`decorateFeed`), notificações simples, thread de comentários e compose v2. O backend
NestJS já tem o pipeline de feed (Redis ZSET + worker de fan-out, ranking), reviews,
likes, comments, saves, follows e notificações básicas. **Nada disso será reescrito**;
a spec é um delta sobre o que existe.

Correções sobre a conversa anterior (a spec conversacional tinha imprecisões):

- São **2 tipos de post** (`photo` e `quote`), sem "quick check-in" e sem "milestone
  como item de feed". Milestone existe só como **notificação**.
- Não há cabeçalhos de grupo no feed ("hoje/esta semana/antes" é do painel de
  notificações).
- Nada de colunas `layout`, `unread`, `group`, `quick_place`, `quick_rating`,
  `milestone_label` na tabela `review`. O layout deriva da presença de foto; o
  agrupamento de notificações é calculado em leitura.
- O repo do backend é `api--positive--feed` (branch `master`), e há um terceiro repo
  (`worker--positive-feed-indexer`) que serializa os campos da review no Redis —
  campos novos são serializados sem alterar o worker.

## 2. Objetivo

Implementar o feed do POC de ponta a ponta:

1. Posts com **título (máx. 60 chars) + descrição**, foto 4:5 com overlay de gradiente
   ou card colorido, ações (curtir/comentar/salvar) e "ler mais" inline.
2. Tela de **post expandido** ("visita") com título, descrição inteira, data,
   comentários e composer.
3. **Painel de notificações** rico: linhas com avatar stack + selo de tipo, agrupadas
   por tempo (hoje/esta semana/antes), não-lidas destacadas, marcador de 30 dias,
   botão "seguir de volta".
4. **Tab bar flutuante** (pill) que encolhe ao rolar para baixo e volta ao subir.
5. **Header do feed** com coração (abre notificações, com badge de não-lidas) e
   toggle de tema claro/escuro.

**Critérios de sucesso:**

- Feed renderiza photo/quote do contrato novo, sem flair, sem borda entre posts.
- Painel de notificações renderiza os 6 tipos da fase 1 com agrupamento e copy do POC.
- Ambos os repos com testes verdes (respeitando os baselines conhecidos).
- Compose publica título + descrição; post antigo (sem título) continua renderizando.

## 3. Não-objetivos

- Conta privada / pedidos para seguir, tags de acompanhante, recomendações de
  perfil/restaurante e resposta de dono de restaurante: os **produtores** não existem
  (não há modelo p/ conta privada, dono ou similaridade). A UI da fase 1 não renderiza
  esses tipos.
- Curtir/descurtir persistido por usuário (o like continua sendo contador; ver D7).
- Deletar/editar comentário, deletar review no feed, share, multi-photo na API
  (carrossel de mock continua funcionando), filtro/busca no feed, paginação do painel
  de notificações.
- Parallax do feed atrás do painel de notificações (o painel cobre a tela inteira,
  como no POC; a translação de -25% é invisível).
- `expo-blur` na tab bar (fundo translúcido sem blur é suficiente).
- Ranking/algoritmo de feed, Redis, worker, autenticação: não mudam.

## 4. Decisões

### D1 — Título e descrição: coluna nova `title`, `comment` continua sendo a descrição

`review` ganha `title TEXT NULL`. `comment` permanece a descrição (sem renomear a
coluna nem a API — evita backfill e quebra). Posts novos exigem título; posts
antigos têm `title NULL` e o front faz fallback:

- `photo`: título do overlay = `title ?? comment`; descrição = `comment` quando
  `title` existe, senão `null`.
- `quote`: texto grande = `title ?? comment`; descrição = `comment` quando `title`
  existe, senão `null`.

### D2 — Layout deriva da foto; `row` sai do feed

`photo` quando há foto (`photoUrl` ou fotos de mock); `quote` caso contrário. O
layout `row` (FeedCard) deixa de existir na decoração do feed — `FeedCard` continua
sendo usado nas telas de perfil e restaurante. `ReviewLayout` fica
`'photo' | 'quote' | 'row'` (mocks e telas antigas ainda usam `row`), mas
`decorateFeed` nunca retorna `row`.

### D3 — Flairs não renderizam no feed

O POC final suprimiu os chips. `FeedPhoto`/`FeedQuote` do feed não renderizam flairs.
Flairs continuam existindo na API, no compose e nas telas de restaurante/perfil.

### D4 — Sem borda entre posts, respiro de 24

Cards do feed perdem `borderBottomWidth` e ganham `marginBottom: 24` (POC usa 22;
ajustado à grade de 4px — ver D14).

### D5 — Contagem de comentários é calculada em leitura

`commentCount` não vira coluna. `GET /feed` enriquece a página com uma query batch
em `comments` (`reviewId In(ids)` + agrupamento em memória). Sem cache para
desatualizar e sem migration. `GET /reviews/:id` e as listas de restaurante/perfil
podem omitir; o front trata `commentCount` como opcional (ícone sem número).

### D6 — Likes mantêm o contador, mas o Redis para de mentir

Like continua sendo contador (sem tabela `review_likes`, sem unlike). `incrementLikes`
passa a refletir no Redis (`hincrby review:{id} likes 1`, só se a chave existir) para
o feed não mostrar contagem velha até o rebuild.

### D7 — Salvar post = salvar o restaurante ("quero ir")

O ícone de salvar do post alterna o save do restaurante via `useSaves` (persistido,
como na página do restaurante). Não há modelo de "post salvo". Nas telas que não
passam handler (restaurante/perfil), o toggle continua visual e local.

### D8 — Agrupamento de notificações em leitura (sem colunas de grupo)

Sem `actor_ids`, `group_count`, `thumb_url`, `milestone_label`, `group_label` na
tabela. `GET /notifications` busca as linhas dos últimos 30 dias (limite 200),
**colapsa** likes por `review_id` e saves por `restaurant_id` (função pura
`collapseNotifications`), e enriquece com batch queries (autores, restaurantes,
reviews p/ rating/thumb). Isso resolve também duplicatas de concorrência.
Única coluna nova em `notifications`: `preview_text` (texto do comentário/label do
marco, imutável).

### D9 — Tipos de notificação da fase 1

| type | produtor | copy (POC) |
|------|----------|------------|
| `like` | já existe (ReviewService) | `@a e mais 4 curtiram sua visita no R` |
| `comment` | já existe (CommentService) + `preview_text` | `@a comentou: "..."` |
| `follow` | já existe (UserService) | `@a começou a seguir você` + botão seguir de volta |
| `save` | **novo** em `SaveService.add` | `3 pessoas salvaram o R no quero ir depois da sua visita` |
| `network_visit` | **novo** em `ReviewService.createPost` | `@a foi ao R, que está no seu quero ir, e deu 4,5` |
| `milestone` | **novo** em `ReviewService.createPost` | `Tim! Seu 50º registro.` |

### D10 — Feed enriquecido (autor e restaurante)

O feed hoje só devolve a review crua (o app resolve nome de restaurante por um mapa
local e mostra o `userId` cru). `GET /feed` passa a enriquecer cada item com:

- `author: { id, name, handle, photoUrl } | null` (batch `users In(userIds)`)
- `restaurant: { id, name, location } | null` (batch `restaurants In(ids)`; `name` =
  `nome_fantasia ?? razao_social ?? id`; `location` = `municipio ?? null` — a tabela
  não tem bairro)
- `commentCount` (D5)

O front usa `author`/`restaurant` quando presentes, com fallback no mapa local.

### D11 — `GET /reviews/:id` novo

Não existe endpoint de review única; abrir post a partir da notificação precisa dele.
Devolve a review + flairs + enriquecimento de D10.

### D12 — Painel de notificações: marcação em lote

`POST /notifications/read` com `{ ids: number[] }` (a linha colapsada guarda os ids
crus). `POST /notifications/:id/read` continua existindo (chama o mesmo serviço).
Abrir o painel **não** marca tudo como lido — só esconde o badge na sessão (POC).

### D13 — Tab bar flutuante e estado `mini`

`Navbar` vira pill flutuante absoluta (bottom 16 + safe-area, left/right 16, altura
64, raio 32, fundo translúcido do tema, borda e sombra). No estado `mini`:
left/right 72, altura 48, bottom 12. A transição é `Animated.timing` de 280ms.
Estado calculado por função pura `nextTabBarState(y, last, mini)` (POC: topo < 40
reseta; delta > 6 encolhe; delta < -6 expande), usada pelo hook `useTabBarMinimize`
no `onScroll` do FlatList (`scrollEventThrottle: 16`). Ícones continuam glyphs/Views
(`⌂`, `⌕`, pino, círculo rosa) — sem lib de ícones.

### D14 — Grade de 4px nos arquivos tocados

O POC usa paddings 10/14/18; o repo tem regra de grade de 4px
(`spacing-usage.test.ts`, hoje falando por causa do redesign atual do feed). Os
valores do feed são ajustados para a grade (10→12, 14→16, 18→16, 22→24); tamanhos
tipográficos permanecem exatos do POC. O teste de espaçamento volta a ficar verde.

### D15 — Gradiente da foto com `expo-linear-gradient`

O scrim do POC é um linear-gradient. Nova dependência `expo-linear-gradient`
(`npx expo install`), com stub no `vitest.config.ts` (host que renderiza children).
Sem `expo-blur`.

### D16 — Overlays deslizam da direita

Nova primitiva `SlideOver` (slide horizontal de 280ms + fade, espelhando o
`LayerScreen`). Usada pelo painel de notificações e pela tela de post. As demais
camadas continuam com `LayerScreen`.

### D17 — Header do feed: coração + toggle de tema

No header do feed (`feedVisible`): wordmark `tim` à esquerda (24px, `im` rosa),
coração `♡` 26px com badge 8px rosa (`unreadCount > 0 && !seen`) e botão de tema
30px circular (`🌙`/`☀️`). O coração abre o painel de notificações. O toggle de tema
define `themeMode` light/dark (o seletor de 3 opções continua nas configurações;
sem persistência, como hoje).

### D18 — "ler mais" medido, não por contagem de caracteres

Novo `ReadMoreText`: `numberOfLines` + `onTextLayout` para detectar truncamento de
verdade (o `ExpandableText` atual chuta por contagem de caracteres e usa a copy
"continuar lendo"). Labels: `ler mais` / `ver menos`. `ExpandableText` permanece nas
telas que já o usam.

## 5. Modelo de dados e migration

`api--positive--feed/scripts/migrations/014_feed_v1.sql` (runner aplica em transação,
uma vez, por ordem de nome):

```sql
-- Feed v1: título da review e preview nas notificações.
ALTER TABLE review ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS preview_text TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_user_recent
  ON notifications (user_id, created_at DESC);
```

Entidades:

- `ReviewEntity`: `@Column({ type: 'text', nullable: true }) title: string | null;`
- `NotificationEntity`: `@Column({ name: 'preview_text', type: 'text', nullable: true })
  previewText: string | null;`

Sem backfill: posts antigos ficam `title NULL` (fallback do front). Hashes Redis
existentes continuam sem `title` até o rebuild — o front trata `title` ausente
como `null` (mesmo fallback).

## 6. Contratos de API

### 6.1 `GET /feed?page=1&limit=20` (alterado — itens enriquecidos)

```jsonc
{
  "page": 1, "limit": 20,
  "results": [{
    "id": 12, "userId": "mari", "restaurantId": "12345678000199",
    "title": "Café da manhã que me fez voltar no sábado",
    "comment": "Torrada de abacate…",
    "rating": 4.5, "likes": 84, "photoUrl": "/uploads/x.jpg",
    "flairs": ["volto sim"], "createdAt": "2026-11-10T12:00:00.000Z",
    "commentCount": 9,
    "author": { "id": "mari", "name": "Mari", "handle": "mari.garfo", "photoUrl": null },
    "restaurant": { "id": "12345678000199", "name": "Casa Gema", "location": "São Paulo" }
  }]
}
```

Campos novos por item: `title`, `commentCount`, `author`, `restaurant`. O resto é
idêntico ao contrato atual (worker serializa `title` automaticamente porque copia a
entidade).

### 6.2 `POST /reviews` (alterado)

Body: `{ restaurantId, rating, title, comment?, photoUrl?, flairs? }`.

- `title`: **obrigatório**, string, `trim()` 1–60 chars. Erro 400
  `title obrigatório` / `title deve ter no máximo 60 caracteres`.
- `comment` continua opcional.

### 6.3 `GET /reviews/:id` (novo)

Review única + flairs + `commentCount`/`author`/`restaurant` (mesmo enriquecimento
do feed). 404 `review não encontrada`.

### 6.4 `POST /reviews/:id/like` (inalterado no contrato)

Efeito novo: reflete no Redis (D6).

### 6.5 `GET /notifications?limit=100` (alterado — painel do POC)

```jsonc
{
  "total": 42,           // linhas crus nos últimos 30 dias
  "unreadCount": 5,      // linhas crus não lidas
  "withinDays": 30,
  "results": [{
    "id": 7,                        // id da primeira linha do grupo
    "ids": [7, 9, 12],              // todas as linhas colapsadas
    "type": "like",
    "actorId": "bea",               // primeiro ator (compat)
    "actors": [
      { "id": "bea", "name": "Bea", "handle": "bea_come_tudo", "photoUrl": null }
    ],
    "count": 5,                     // nº de linhas (= atores) colapsadas
    "reviewId": 12,
    "review": { "id": 12, "rating": 4.5, "photoUrl": "/uploads/x.jpg" },
    "restaurantId": "12345678000199",
    "restaurant": { "id": "12345678000199", "name": "Boteco da Ana", "location": "São Paulo" },
    "previewText": null,
    "readAt": null,
    "createdAt": "2026-11-10T14:00:00.000Z"
  }]
}
```

- `limit` 1–200 (default 100); busca só os últimos 30 dias; ordenado por
  `created_at DESC`; colapsa `like` por `review_id` e `save` por `restaurant_id`
  (merged usa `createdAt` da mais recente e `readAt = null` se qualquer linha do
  grupo estiver não-lida).
- Tipos sem grupo (`comment`, `follow`, `network_visit`, `milestone`) viram uma
  linha cada com `ids: [id]`, `count: 1`.

### 6.6 `POST /notifications/read` (novo)

Body `{ "ids": [7, 9] }` → `{ "read": true, "updated": 2 }`. Só marca linhas do
próprio usuário e só as que estão não-lidas.

### 6.7 `POST /notifications/:id/read` (mantido)

Delegate para o serviço do 6.6 com `[id]`.

## 7. Comportamento do backend

### 7.1 `ReviewService`

- `createPost`: valida `title` (D2/6.2), persiste, emite `post_created`/`feed_rebuild`
  com a entidade completa (worker serializa `title` junto).
- **Produtor `network_visit`** (após salvar o post): seguidores do autor que têm o
  restaurante salvo. `follows where followingId = autor` → `saves where userId In
  (followerIds) and restaurantId = review.restaurantId` → uma notificação por
  seguidor (exclui o próprio autor; cap de 200 notificações; pula tudo se o autor
  tiver > 5000 seguidores — mesma regra de celebridade do worker).
- **Produtor `milestone`** (após salvar o post): `count({ where: { userId } })` e, se
  bater em `[1, 10, 25, 50, 100, 250, 500]`, cria notificação
  `{ userId: autor, type: 'milestone', previewText: `${count}º registro` }`.
- `incrementLikes`: além do fluxo atual, `hincrby('review:{id}', 'likes', 1)` se
  `exists('review:{id}')`.
- `enrichFeed(reviews)` (privado, usado nos 3 branches do `findFeed` e pelo
  `GET /reviews/:id`): batches de `users`, `restaurants` e `comments`; produz
  `author`, `restaurant`, `commentCount` (6.1). `findFeed` retorna o DTO enriquecido
  (o `rank` interno continua removendo o `score`).
- `findOne(id)`: nova, para o `GET /reviews/:id` (404 se não existir; anexa flairs e
  enriquece).

Novas dependências injetadas no construtor (todas `@Optional`, no fim da lista,
para não quebrar os specs existentes): `Repository<User>`, `Repository<Restaurant>`,
`Repository<CommentEntity>`, `Repository<Save>` (o `saves` já existia).

### 7.2 `CommentService`

`add` passa `previewText: trimmed.slice(0, 140)` na notificação (quando notifica).

### 7.3 `SaveService`

`add` ganha `NotificationService` (`@Optional`). Após o upsert: últimas 20 reviews do
restaurante (`createdAt DESC`), um revisor distinto por linha (excluindo quem salvou)
→ notificação `{ type: 'save', actorId: quem salvou, reviewId, restaurantId }`.

### 7.4 `NotificationService`

- `create(input)` ganha `previewText?: string | null`.
- `list(userId, limit)`: linhas cruas dos últimos 30 dias (cap 200) →
  `collapseNotifications` → enriquecimento batch (`users` por `actorId` distinto,
  `restaurants` por `restaurantId`, `reviews` por `reviewId` p/ `rating`/`photoUrl`)
  → `{ results, total, unreadCount, withinDays: 30 }`.
- `markReadMany(ids, userId)`: `update({ id: In(ids), userId, readAt: IsNull() },
  { readAt: new Date() })` → `{ read: true, updated: affected }`.
- `collapseNotifications` fica em arquivo próprio
  (`src/application/service/collapseNotifications.ts`), função pura testável.

### 7.5 Controllers

- `review.ts`: `@Get('/reviews/:id')`.
- `notification.ts`: `@Get('/notifications')` com o contrato 6.5 e
  `@Post('/notifications/read')` (6.6).

## 8. Frontend

### 8.1 Módulo novo `src/notifications/`

| Arquivo | Papel |
|---------|-------|
| `useNotifications.ts` (movido de `src/comments/`) | carrega lista + `unreadCount`; `markRead(ids)` otimista; `followBack(actorId)` com `followUser` |
| `NotificationScreen.tsx` (movido de `src/settings/`) | painel: grupos, rows, end marker, loading/error |
| `NotificationRow.tsx` | row rica (avatar stack + selo + texto + thumb + follow) |
| `notificationText.ts` | `notificationSegments(n): Segment[]` (copy do POC, pt-BR) |
| `groupNotifications.ts` | `groupNotifications(items, now?): NotificationGroup[]` (hoje/esta semana/antes + filtro 30d) |

`Segment = { text: string; emphasis?: 'strong' | 'muted' }` — `strong` renderiza com
peso 600, `muted` com cor `sub`. Handles ficam `@handle` no texto.

### 8.2 Componentes comuns novos

| Arquivo | Papel |
|---------|-------|
| `src/common/SlideOver.tsx` | overlay absoluto com slide da direita (280ms) |
| `src/common/AvatarStack.tsx` | 1 avatar 44 ou stack de 2 (32px, borda 2px `bg`) + `tag` opcional (19px, glifo 10) |
| `src/common/ReadMoreText.tsx` | texto com `numberOfLines` + `onTextLayout`, labels `ler mais`/`ver menos` |
| `src/feed/tabBarState.ts` | `nextTabBarState(y, last, mini): { mini: boolean; last: number }` (pura) |
| `src/feed/useTabBarMinimize.ts` | hook que envolve `nextTabBarState` no `onScroll` |

### 8.3 Feed cards (reescrita de `FeedPhoto` e `FeedQuote`)

**Comum aos dois:** sem `borderBottom`; `marginBottom: 24`; header com avatar 34
(cor via `avatarColor(userId)`, foto quando `author.photoUrl`), `@handle` display700
14, restaurante display600 12 + `location` sub, `StarRating` à direita (mostarda;
no quote, cor do ink do card); ações (curtir ♥/♡ + count, comentar 💬 +
`commentCount`, salvar 🔖/☆ à direita, controlado quando há `onSave`); tempo
`há 3h` (12, `sub`) na linha abaixo das ações; sem flair.

**FeedPhoto:** imagem 4:5 (carrossel de mock continua); scrim
`expo-linear-gradient` (transparente → `rgba(0,0,0,0.72)`); sobre a foto: título
display700 17/22 (máx. 2 linhas, fallback D1) + descrição display500 13/18 com
`ReadMoreText` clamp 2; padding do overlay 112/16/16. Like local não repete
(`liked` trava o tap; count = `likes + (liked ? 1 : 0)`).

**FeedQuote:** card mostarda/picles/rosa (`tone` do `decorateFeed`), raio 16,
padding 16, margem 12/16: avatar 28 translúcido, `@handle` display700 13, estrelas na
cor do card; título display700 22/28; descrição display500 15/22 clamp 3 com
`ReadMoreText`; meta: restaurante 12 600 + ações na cor do ink + tempo.

**`decorateFeed`:** só retorna `photo`/`quote` (foto quando `photoUrl`/mock-photos;
senão quote com `tone` alternando mostarda→picles→lambeLambe). `strong` deixa de ser
calculado (flair forte não renderiza no feed).

**Interação:** tap no card abre o restaurante (como hoje); ícone de comentário abre o
post expandido; `onLike` do App continua com o bump otimista do `useFeed`.

### 8.4 Post expandido (`src/feed/PostDetailScreen.tsx`)

Substitui `CommentThreadScreen` (arquivo e teste são removidos; `useComments`
permanece em `src/comments/`). Header `← visita` (19); autor como no feed; hero
(foto 4:5 + overlay de título display700 17, ou card colorido raio 18 com título
display700 23 + descrição 15); descrição inteira display500 15/22 abaixo (photo);
data `10 nov · há 3h` (12 sub); ações; `comentários` (display700 13 sub); lista
(avatar 28, texto 13/19, tempo) e composer pill (raio 22, placeholder
`comentar…`, botão `comentar` rosado). Erro de envio: `Não consegui comentar agora.
Tente de novo.`

### 8.5 Painel de notificações

Aberto pelo coração do header dentro de `SlideOver`. Rows (min-height 64, padding
12/16, gap 12; não-lida com fundo `unreadBg`): `AvatarStack` + selo
(`♥` rosa / `💬` berinjela / `＋` picles / `🔖` mostarda; milestone = círculo
berinjela 44 com `🔔`), texto (13.5/19; handle display700), tempo `· 2h` 12 sub,
thumb 44 raio 8 (foto da review ou tile colorido com inicial do restaurante),
botão seguir (raio 20, display700 12, `seguir de volta`/`seguindo`).

Grupos `hoje` / `esta semana` (< 7d) / `antes` (headers display700 13 sub, padding
20/16/8) e rodapé central `isso é tudo dos últimos 30 dias` (12 sub).

Tap na row: `markRead(ids)` + navega — review (`like`/`comment`/`save`/
`network_visit`) abre `PostDetailScreen` via `getReview(id)`; `follow` abre o perfil;
`milestone` só marca como lida.

Estados: `carregando…`; erro `não consegui carregar as notificações.` com botão
`tentar de novo`; vazio `nenhuma notificação por aqui.`

### 8.6 Tab bar e header (App)

- `Navbar` reescrita como pill flutuante (D13). O conteúdo do feed ganha
  `paddingBottom: 104`. Navbar escondida quando há overlay aberto (como hoje).
- Header do feed: wordmark + coração + badge + toggle de tema (D17). Banner de
  loading/erro do feed continua onde está. O título `reviews recentes` sai do
  `ListHeaderComponent` (o POC não tem).
- `App` passa `saved`/`onSave` (via `useSaves`), `onComments` (abre
  `PostDetailScreen`), `onLike` e `onAuthorPress` pros cards; usa
  `useNotifications` no topo para o badge; `notifSeen` esconde o badge na sessão.
- `useFeed` não muda de contrato (só o tipo `Review` ganha campos opcionais).
- Busca no feed (`onOpenReview`) passa a abrir `PostDetailScreen` via `getReview`.

### 8.7 Compose

`ComposeV2` ganha campo de título (obrigatório, `maxLength` 60, placeholder
`Dá um título pra visita (máx. 60)`) acima da descrição; `canSend` exige título
não-vazio; `postReview` envia `title`; o preview do quote usa o título. Erros do
backend de title viram `friendlyApiError` de publicação.

### 8.8 Tipos e helpers

`Review` ganha `title?`, `commentCount?`, `author?`, `restaurant?`. `AppNotification`
é reescrito (6.5). Helpers novos em `common/format.ts`:

- `formatRelativeLong(iso)`: `agora` | `há 3h` | `há 2d`
- `formatShortDate(iso)`: `10 nov` (pt-BR, sempre do `createdAt` em UTC-local do
  dispositivo)
- `displayName(author)`: `@handle` | `name` | `'alguém'`

`StarRating` passa a usar o `color` prop (default mostarda; estrela vazia = mesma cor
com 30% de opacidade).

## 9. Copy e formatação

- Tempos relativos: `agora`, `há 3h`, `há 2d` (feed, notificações, post, comentários).
- Data do post: `10 nov · há 3h`.
- Notificações (segmentos): `@bea_come_tudo` (handle) `e mais 4 curtiram sua visita
  no` `Boteco da Ana` (strong) `· 2h` (muted). Plural: count 1 → `@a curtiu sua
  visita no R`; count 2+ → `@a e mais {count-1} curtiram…`. Save: `1 pessoa salvou…`
  / `{count} pessoas salvaram…`. Nota do network_visit: `(rating * 2).toFixed(1)`
  com vírgula (`4,5`).
- Copys de botão: `ler mais`/`ver menos`, `seguir de volta`/`seguindo`, `comentar`,
  `tentar de novo`.

## 10. Estados e erros

- Feed: banner `Carregando feed…` / `Não consegui carregar o feed.` + `tentar de
  novo` (existente), empty state existente.
- Notificações: loading/erro/vazio como em 8.5. `followBack` falhou → volta o botão
  para `seguir de volta`.
- Post: erro de comentário existente; review não encontrada (`getReview` 404) →
  fecha o overlay e mostra o banner de erro do feed.

## 11. Testes

**Backend (vitest):** `collapseNotifications` (agrupa like por review, save por
restaurante, mescla atores/ids/count/readAt, tipos sem grupo); `NotificationService`
(list enriquecido + unreadCount, markReadMany só do dono); `ReviewService`
(title obrigatório/>60/ok, `network_visit`, `milestone`, `incrementLikes` reflete no
Redis, `enrichFeed`, `findOne` 404); `CommentService` (previewText); `SaveService`
(produz save p/ revisores, exclui quem salvou); `migrate` (014 entra na lista).

**Frontend (vitest + react-test-renderer):** `nextTabBarState`; `ReadMoreText`
(ler mais/ver menos); `FeedPhoto`/`FeedQuote` (título+descrição, fallback sem
título, contadores, save controlado, sem flair, sem borda); `decorateFeed` (sem
`row`); `PostDetailScreen` (hero photo/quote, comentários, composer);
`notificationSegments` (cópia dos 6 tipos, plurais); `groupNotifications`
(hoje/semana/antes, filtro 30d); `useNotifications` (unreadCount, markReadMany
otimista, followBack); `NotificationRow` (stack, selo, thumb, seguir);
`NotificationScreen` (grupos, end marker, estados); `SlideOver`; `Navbar` (pill,
mini); `formatRelativeLong`/`formatShortDate`/`displayName`; `ComposeV2` (título
obrigatório, envia title); `api` (`getReview`, `markNotificationsRead`).

Critério de suite: `npm test` do app **100% verde** (inclui consertar as 2 falhas
atuais de spacing/decorate). Na API, verdes todos os arquivos que esta spec toca
(`PlaceService.spec.ts` segue com as 6 falhas do WIP não commitado, sem relação).

## 12. Rollout e compatibilidade

- Migration 014 roda no boot (runner idempotente por `schema_migrations`).
- Redis: hashes antigos sem `title` → front trata como legado; `network_visit`/
  `milestone`/`save` passam a ser gerados só para eventos novos.
- Apps antigos chamando `GET /feed` recebem campos extras (compatível);
  `GET /notifications` muda de shape (formato novo) — só o app consome.
- Deploy: API primeiro (contrato novo + produtores), depois o app.

## 13. Estrutura de arquivos

**Backend (`api--positive--feed`, branch `master`):**

- Create: `scripts/migrations/014_feed_v1.sql`,
  `src/application/service/collapseNotifications.ts` (+ `.spec.ts`)
- Modify: `src/infrastructure/entity/ReviewEntity.ts`,
  `src/infrastructure/entity/Notification.ts`,
  `src/application/service/ReviewService.ts` (+spec),
  `src/application/service/NotificationService.ts` (+spec),
  `src/application/service/CommentService.ts` (+spec),
  `src/application/service/SaveService.ts` (+spec),
  `src/controller/review.ts`, `src/controller/notification.ts`,
  `src/migrate.spec.ts`

**Frontend (`app--positive`, branch `main`):**

- Create: `src/common/SlideOver.tsx`, `src/common/AvatarStack.tsx`,
  `src/common/ReadMoreText.tsx`, `src/feed/tabBarState.ts` (+spec),
  `src/feed/useTabBarMinimize.ts`, `src/feed/PostDetailScreen.tsx` (+spec),
  `src/notifications/*` (screen, row, text, groups, hook, specs)
- Modify: `src/common/theme.ts` (+spec), `src/common/format.ts` (+spec),
  `src/common/Navbar.tsx` (+spec novo), `src/feed/FeedPhoto.tsx` (+spec),
  `src/feed/FeedQuote.tsx` (+spec), `src/feed/decorateFeed.ts` (+spec),
  `src/feed/StarRating.tsx`, `src/common/types.ts`, `src/api/types.ts`,
  `src/api/api.ts` (+spec: `getReview`, title no postReview),
  `src/api/comment.ts` (`markNotificationsRead`), `src/compose/ComposeV2.tsx`
  (+spec), `App.tsx`, `vitest.config.ts` (stub do `expo-linear-gradient`)
- Delete: `src/comments/CommentThreadScreen.tsx` (+spec),
  `src/settings/NotificationScreen.tsx` (+spec) — substituídos pelos módulos novos
- Move: `useNotifications.ts` de `src/comments/` para `src/notifications/`

## 14. Checklist de aceite

- [ ] Feed renderiza photo (overlay título+descrição, gradiente, "ler mais") e quote
      (título grande + descrição clamp 3) sem flair e sem borda.
- [ ] Título > 60 chars rejeitado no backend e travado no compose.
- [ ] Post antigo sem título renderiza com fallback (photo e quote).
- [ ] Ícone de comentário e review da busca/notificação abrem o post expandido com
      comentários funcionando (persistência na API).
- [ ] Salvar no card persiste o save do restaurante (aparece no "quero ir" do perfil).
- [ ] Curtir incrementa o feed sem rebuild (Redis atualizado).
- [ ] Painel de notificações: 6 tipos com copy do POC, grupos de tempo, não-lidas
      destacadas, seguir de volta funcional, rodapé de 30 dias.
- [ ] Coração com badge some ao abrir o painel (sessão) e volta com novas não-lidas.
- [ ] Tab bar pill flutua, encolhe ao descer, volta ao subir e no topo.
- [ ] Toggle de tema no header troca claro/escuro em todo o feed e painel.
- [ ] `npm test` verde no app; specs do backend tocados verdes; `tsc --noEmit` limpo.
