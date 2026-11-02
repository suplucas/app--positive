# docs/07 — Navegação limpa

Pacote de correções de navegação identificadas no audit do frontend
(2026-10). Sem mockup — ajustes de comportamento.

## O que mudou

1. **Banner do feed**: removeu "Fim do feed" e "Carregando mais…" —
   sobrou só o que pede atenção (carregando inicial, erro, vazio). O
   banner agora **só aparece no feed de verdade**: não vaza mais para a
   página do restaurante nem para as configurações.
2. **Retorno restaurante → avaliar**: a página do restaurante deixou de
   "morrer" ao abrir a avaliação. Cancelar **e** publicar voltam para o
   restaurante (que continua sob a tela de composição). Navegar pela
   navbar (feed/perfil) fecha sub-telas de propósito.
3. **Navbar**: "buscar" e "notif." ainda não existem — passaram a
   **desativados** (opacidade 30%, sem resposta a toque, `disabled`
   em accessibility) em vez de inativos enganosos.
4. **"salvar" do card com foto** virou ação real: toggle local
   `salvar` ↔ `salvo` (estado por card, testID `salvar-{id}`).

## Arquivos

| Item | Onde |
|------|------|
| Banner + ordem das sub-telas + navbar | `App.tsx` |
| `disabled` nos itens não implementados | `src/Navbar.tsx` |
| Toggle "salvar" | `src/FeedPhoto.tsx` |
| Teste do toggle | `src/FeedPhoto.test.tsx` |

## Limitação conhecida

Publicar a partir do restaurante atualiza o **feed**, mas a página do
restaurante usa dados mock determinísticos (`restaurantMock`), então a
review nova só aparece lá quando existir endpoint real.

## Error handling (E1/E2)

- `friendlyApiError(technical, 'feed' | 'publish')` (`src/format.ts`):
  status/endpoint somem da UI; erro de rede/offline vira
  "Sem conexão. Verifique a rede e tente de novo."; o resto vira copy
  do contexto ("Não consegui carregar o feed." / "Não consegui publicar
  sua avaliação."). Usada no banner do feed e nos dois composers.
- Banner de erro no feed ganhou **"· tentar de novo"** (chama
  `refresh()`), sem depender só do pull-to-refresh.

## Suavidade (S1/S2/S3)

- **Transição de sub-telas**: restaurante, avaliação e configurações
  viram **camadas** (`LayerScreen`) sobre o conteúdo principal, com
  fade + slide de 180ms na entrada. Dois efeitos colaterais bons: o
  feed continua montado (posicao de scroll preservada ao voltar) e o
  restaurante continua vivo sob a tela de avaliacao (acabamento do N2).
  A saída é instantânea (revela a camada de baixo).
- **Tick ativo no slider de nota**: o tick do valor atual fica opaco e
  em escala 1; os demais, quietos (35%, escala 0.85) — como no mock
  docs_04.
- **Press feedback padronizado**: opacidade 0.85 em todos os cards de
  feed (linha estava em 0.7).

## Feed v2 — variante de UI do card de foto

- `FeedPhoto` ganhou `variant` (`v1` padrão | `v2` teste):
  - v2: **autor + "em {restaurante}" + tempo ficam dentro da imagem**
    (topo, texto claro sobre um scrim `rgba(36,26,34,0.45)` — sem lib de
    gradiente nos deps), imagem **420 → 480** e selo de nota no
    **rodapé** direito;
  - v1 segue como antes (linha acima, nota no topo).
- **Seletor `feed v1 / feed v2 · teste`** no header do feed (onde o
  seletor de usuário existia), só visível quando o feed está visível;
  padrão v1. Só o card de foto muda — quote/linha continuam iguais.
- Testes: `src/FeedPhoto.test.tsx` (linha dentro do frame, scrim, altura
  480, nota no rodapé / comportamento v1 preservado).
- Backlog então pendente: busca, "quero ir", notificações — entregue
  nos pacotes docs/08 (busca), docs/10 ("quero ir") e docs/09
  (notificações); N5 (perfil × usuário ativo) no docs/11.
- Backlog restante então: thread de comentários, upload real de foto,
  error boundary (E3) — entregues em docs/12 (thread 💬), docs/13
  (foto real via galeria) e docs/14 (error boundary). **Audit de
  frontend encerrado.**
- Pendências de backend (fora do escopo do frontend): sync de
  comentários, upload de foto para a API, endpoints de restaurante e
  de perfil.

Validação (audit + pacotes): `npm test` (129 testes) e
`npm run typecheck` limpos.
