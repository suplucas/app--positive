# docs/12 — Thread de comentários (💬 dos cards)

Item do backlog do audit (docs/07). O 💬 dos cards de feed (que não
existia — a meta tinha só likes/tempo) agora abre a conversa da
review.

## O que mudou

- **`src/commentMock.ts`**: `ReviewComment { id, userId, text,
  createdAt }` + `commentsFor(reviewId)` — thread determinística pelo
  id da review (2–4 itens, mesmo hash do `restaurantFor`; "agora"
  arredondado à hora p/ reprodutibilidade em teste). Ids no formato
  `{reviewId}-c{i}` (espelhados em testID).
- **`src/CommentThreadScreen.tsx`**:
  - review original compacta no topo (`comentario-original`: avatar,
    handle, "em {restaurante} · nota", texto);
  - lista de comentários (`comentario-{id}`): avatar + handle + texto
    + tempo relativo;
  - **composer local**: `comentario-novo` + botão `comentar`
    (desabilitado com texto vazio) — o comentário novo é **apenas
    estado da tela** (a API não tem endpoint de comentários);
  - rodapé: "Comentários em modo demo — sincronizam quando houver
    endpoint."
- **Cards**: `FeedCard`/`FeedQuote`/`FeedPhoto` ganharam prop opcional
  `onComments` → botão 💬 com testIDs `comentar-card-{id}` /
  `comentar-quote-{id}` / `comentar-photo-{id}`. Sem o callback,
  **sem botão** (cards da página do restaurante não têm thread).
- **`App.tsx`**: `commentReview: Review | null`; os 3 `renderItem`
  passam `onComments`; camada `LayerScreen` no topo da pilha (acima da
  lista "quero ir"); navbar oculta com a thread aberta.

## Decisões

- **Mock + composer local**: a thread dá sensação de conversa real
  (mock determinístico + comentário seu aparece na hora), sem mentir
  que há sync — o rodapé declara o modo demo.
- **Escopo**: só o feed liga o 💬; a página do restaurante reusa os
  cards sem `onComments` de propósito (evita botões mortos em sub-tela).

Validação: `npm test` (144 testes) e `npm run typecheck` limpos.
