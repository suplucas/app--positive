# docs/08 — Tela de busca (lupa da navbar)

Item do backlog do audit (docs/07). Implementa os fluxos "Feed →
Buscar" (toque na lupa) e "Busca → Página Canonical do Restaurante"
(docs/01 §04).

## O que mudou

- **`src/SearchScreen.tsx`**: campo de busca (`⌕` + TextInput,
  placeholder "restaurante ou bairro") + lista de resultados.
  - **Fonte**: `searchRestaurants(query)` (`src/format.ts`) — mesma
    busca textual no mapa do seed usada no composer (mesma fonte,
    zero backend novo).
  - **Query vazia**: rótulo "sugestões" + primeiros 8 do mapa.
  - **Com query**: rótulo "resultados" + linhas `nome`
    (display700) + meta `categoria · bairro · preço · a {km}km`
    (de `restaurantFor`) + `→`.
  - **Sem resultado**: copy de produto "Não encontramos "q" por aqui.
    Tente outro nome ou bairro."
  - Toque na linha → `onOpenRestaurant(cnpj)` → página do restaurante
    (camada `LayerScreen` sobre a busca; ao voltar, a busca e o texto
    digitado continuam vivos).
- **`src/Navbar.tsx`**: `Screen` ganhou `'busca'`; item "buscar"
  saiu do estado `disabled` (30%, sem toque) para item ativo de
  verdade (`active={active === 'busca'}`, `onNavigate('busca')`).
- **`App.tsx`**: wordmark `busca` + ramo de conteúdo
  (`screen === 'busca' ? <SearchScreen onOpenRestaurant={(c) =>
  setRestaurantCnpj(c)} />`). Navbar continua visível na busca
  (modelo de abas; "feed" na navbar volta pro feed).

## Testes

`src/SearchScreen.test.tsx`: sugestões (8, 1ª = início do mapa), busca
"kyoto" → Kyoto sushi bar, toque abre o CNPJ correto, copy de vazio,
meta com `·` e `km`.

Validação: `npm test` (114 testes) e `npm run typecheck` limpos.
