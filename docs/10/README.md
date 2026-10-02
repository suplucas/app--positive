# docs/10 — Lista "quero ir" (saves compartilhados)

> **Revisão docs/16:** o mock `app completo (2)` moveu a lista para
> dentro do perfil, como **aba `quero ir · N`** (com diário/listas).
> O chip `☆ quero ir` e a tela `SavedScreen` (camada) foram **removidos**;
> a renderização virou o `SavedList` reutilizável. A fonte de estado
> segue a mesma (`savedCnpjs` no App). Ver `docs/16`.

Item do backlog do audit (docs/07). Liga o toggle "quero ir" da página
do restaurante e o "salvar" a uma lista gerenciável (docs/01 §01/§04:
"Lista Quero Ir").

## Decisão de arquitetura

**Fonte única de saves no App**: `savedCnpjs: string[]`
(`App.tsx`). Quem toca:

- **`RestaurantScreen`** — perdeu o estado local `saved`; agora
  recebe `saved?: boolean` + `onSaveToggle?: () => void` (o App
  decide; o botão só avisa).
- **`SavedScreen`** (nova) — lista os saves; "tirar" remove, toque na
  linha abre a página do restaurante (fecha a lista).

Assim, salvar num restaurante aparece na lista na hora, e o que sai da
lista volta a "☆ quero ir" na página.

## O que mudou

- **`src/SavedScreen.tsx`**: topbar `←` + `SectionTitle`
  `quero ir · N` + linhas (nome `display800` + meta
  `categoria · bairro · preço · km` de `restaurantFor`) com **dois
  alvos** por linha (evita conflito de evento): `salvo-linha-{cnpj}`
  (abrir) e `salvo-tirar-{cnpj}` (remover). Lista vazia:
  `salvo-vazio` com copy explicando como salvar.
- **`src/ProfileScreen.tsx`**: chip `☆ quero ir · N` (testID
  `abrir-quero-ir`) na linha de versões — só renderiza quando o App
  passa `onSavedList` (props `savedCount?: number; onSavedList?:
  () => void`).
- **`App.tsx`**: estado `savedCnpjs` + `toggleSaved` (inclui/remove);
  camada `LayerScreen` (`savedOpen`) contendo a `SavedScreen`;
  navbar oculta com a camada aberta; `RestaurantScreen` recebe
  `saved`/`onSaveToggle`; `ProfileScreen` recebe `savedCount`/
  `onSavedList`.
- **`RestaurantScreen.test.tsx`**: teste de toggle reescrito para o
  contrato de props (callback + estado refletido em `★ salvo`).

## Fluxo

Perfil → chip `☆ quero ir · N` → lista (camada animada) →
- tocar linha → página do restaurante (lista fecha);
- `★` → remove da lista (contagem do chip cai junto).

Validação: `npm test` (126 testes) e `npm run typecheck` limpos.
