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

## Próximos passos do audit (pendentes)

- Error handling: copy amigável de erro + "tentar de novo" (E1/E2).
- Suavidade: transição de tela + tick ativo no slider de nota (S1/S2).
- Feed v2 (variante com avatar/texto sobre a foto + seletor v1/v2).
- Backlog: tela de busca, lista "quero ir", notificações.

Validação: `npm test` (102 testes) e `npm run typecheck` limpos.
