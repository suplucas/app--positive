# Telas do Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar as 4 telas/melhorias restantes do audit do frontend: busca (lupa), notificações, lista "quero ir" (saves) e perfil ligado ao usuário ativo (N5).

**Architecture:** Busca e notificações viram **telas principais** da navbar (extensão do tipo `Screen`); "quero ir" vira **camada** (`LayerScreen`, padrão dos pacotes 2/3) com estado `savedCnpjs` no App, compartilhado com o toggle da página do restaurante; o perfil passa a receber `userId` do App (identidade), mantendo conteúdo (stats/diário/listas) mockado.

**Tech Stack:** React Native + Expo, React 19, Vitest + react-test-renderer com stubs (`vitest.config.ts`), PT-BR em toda a copy.

**Spec:** `docs/01/02-componentes-e-telas.md` (Modal de Busca), `docs/01/03-padroes-de-interacao.md` (fluxos "Feed → Buscar", "Busca → Página Canonical", "Quero Ir"), audit em `docs/07/README.md`.

## Global Constraints

- TDD: teste RED → GREEN mínimo → `npm test` completo + `npm run typecheck` limpos → commit por pacote (mensagem `feat: …`).
- Copy em PT-BR, tom de produto (sem jargão técnico na UI).
- Fontes/tokens sempre de `src/theme.ts` (`fonts`, `spacing`, `palette`, `useTheme`).
- Testes: stubs RN simples (host nodes); interagir via `r.root.findByProps({ testID }).props.onPress()/onChangeText(...)`; texto coletado por `findAll(n => String(n.type) === 'Text')`.
- Dados: `searchRestaurants` (`src/format.ts`) como fonte de busca (mesmo mapa do seed); `restaurantFor` (`src/restaurantMock.ts`) para meta dos resultados/saves; `restaurantNames` para nomes.
- Docs: cada pacote ganha `docs/NN/README.md` (08→11) e o backlog pendente de `docs/07/README.md` é atualizado.

## Review Focus

- **Busca com query sem resultado:** a UI mostra copy amigável ("Não encontramos…"), nunca lista vazia sem explicação nem erro técnico.
- **Query vazia na busca:** mostra sugestões (primeiros 8 do mapa), não tela em branco.
- **Toggle "quero ir" do restaurante e lista "quero ir":** o mesmo estado (CNPJ salvo) é a fonte dos dois — salvar no restaurante deve aparecer na lista e o contrário deve remover.
- **Perfil com usuário demo desconhecido (ex.: `user_1`):** nome derivado deterministicamente ("User 1"), nunca `undefined`/vazio no nome, handle ou bio.
- **Notificação com cnpj vs. sem:** a linha abre o restaurante só quando há cnpj; sem cnpj, inerte (sem crash por callback ausente).

---

### Task 1: Tela de busca (`SearchScreen`) — docs/08

**Files:**
- Create: `src/SearchScreen.tsx`, `src/SearchScreen.test.tsx`, `docs/08/README.md`
- Modify: `src/Navbar.tsx` (tipo `Screen` + item "buscar" ativo), `App.tsx` (roteamento + wordmark)

**Interfaces:**
- Produces: `export function SearchScreen({ onOpenRestaurant }: { onOpenRestaurant: (cnpj: string) => void })`
- `Navbar`: `export type Screen = 'feed' | 'busca' | 'perfil' | 'compose'` (+'notif' na Task 3); item "buscar" passa a `active={active === 'busca'}` e `onNavigate('busca')` (remove `disabled` dele).
- `App`: wordmark `screen === 'busca' ? 'busca'`; conteúdo principal `screen === 'busca' ? <SearchScreen onOpenRestaurant={(c) => setRestaurantCnpj(c)} />` (overlay de restaurante funciona sobre ela); navbar segue visível com `active='busca'`.

- [x] **Step 1: Testes RED** em `src/SearchScreen.test.tsx`:
  1. Query vazia → 8 linhas de resultado (helper: contar `testID` começando com `busca-hit-`); inclui `busca-hit-60602022000153` (1º do mapa).
  2. `findByProps({ testID: 'busca-input' }).props.onChangeText('kyoto')` → 1 linha; texto da árvore contém `Kyoto sushi bar`.
  3. Tocar `busca-hit-33229301000140` → `onOpenRestaurant` chamado com `'33229301000140'`.
  4. Query `'zzznotexist'` → 0 linhas `busca-hit-*`; texto contém `Não encontramos`.
  5. Linha de resultado mostra meta com `·` e `km` (categoria/bairro/preço/distância de `restaurantFor`).

- [x] **Step 2: Rodar e confirmar FAIL** (`npx vitest run src/SearchScreen.test.tsx`).

- [x] **Step 3: Implementar `SearchScreen`**: `ScrollView` (bg `t.bg`) → campo (View arredondado com borda `t.line`, "⌕" + `TextInput` testID `busca-input`, placeholder `restaurante ou bairro`, `autoCapitalize="none"`, `autoCorrect={false}`) → lista. `const hits = searchRestaurants(query)`; query vazia = rótulo `sugestões`, senão `resultados` (via `SectionTitle` ou Text sub). Linha = `Pressable` (testID `busca-hit-${cnpj}`, `onPress={() => onOpenRestaurant(cnpj)}`, press opacity 0.85) com nome (`display700`) + meta `categoria · bairro · preco · {km}km` (de `restaurantFor(cnpj)`) + `→` à direita. Vazio: `Não encontramos "q" por aqui. Tente outro nome ou bairro.`

- [x] **Step 4: `src/Navbar.tsx`** — estender `Screen` com `'busca'`, habilitar item buscar (ativo/`onNavigate`); **`App.tsx`** — wordmark + ramo de conteúdo + `onOpenRestaurant` → `setRestaurantCnpj`.

- [x] **Step 5: `npm test` completo + `npm run typecheck` → ambos limpos.**

- [x] **Step 6: `docs/08/README.md`** (mock→código, decisões, testIDs) + commit `feat: tela de busca (lupa da navbar)`.

### Task 2: Tela de notificações (`NotificationScreen`) — docs/09

**Files:**
- Create: `src/notificationMock.ts`, `src/NotificationScreen.tsx`, `src/NotificationScreen.test.tsx`, `docs/09/README.md`
- Modify: `src/Navbar.tsx` (`Screen` + 'notif', item "notif." ativo), `App.tsx` (wordmark `notifs` + ramo de conteúdo)

**Interfaces:**
- Produces: `export type AppNotification = { id: string; icone: string; texto: string; cnpj?: string; createdAt: string }` + `export const MOCK_NOTIF: AppNotification[]` (4 itens em `notificationMock.ts`, `createdAt` via `hoursAgo`).
- `export function NotificationScreen({ onOpenRestaurant }: { onOpenRestaurant?: (cnpj: string) => void })`

- [x] **Step 1: Testes RED**:
  1. 4 linhas `notif-n1`…`notif-n4` presentes.
  2. Árvore contém texto de produto: `curtiu sua avaliação` e autor `caio.garfo`.
  3. Linha com cnpj (`notif-n1`) tem `onPress` definido; ao tocar, `onOpenRestaurant('64523266000100')`.
  4. Linha sem cnpj (`notif-n3`) tem `onPress` ausente (inerte).
  5. Tempo relativo presente (ex.: `2h` — `formatRelative`).

- [x] **Step 2: Confirmar FAIL.**

- [x] **Step 3: Mock** (`n1` ♥ "caio.garfo curtiu sua avaliação do Beco's Pizzaria", cnpj `64523266000100`, 2h; `n2` ✎ "renatocritico avaliou o MERCADO TUNICO — 9.4", cnpj `21875754000165`, 6h; `n3` ★ "3 avaliações novas nos lugares da sua lista Quero Ir", sem cnpj, 30h; `n4` ＋ "isa.mastiga começou a seguir você", sem cnpj, 200h).

- [x] **Step 4: Componente**: `ScrollView` bg `t.bg`; linha = View/Pressable (testID `notif-${id}`, separador hairline) com ícone, texto (corpo500; autor em negrito via Text aninhado), tempo `formatRelative` à direita (sub). Pressable com `onPress={() => onOpenRestaurant?.(cnpj)}` **somente** quando `cnpj` existe; senão `View`. Rodapé curto: "Notificações mock — entram com endpoint real." (sub, 12).

- [x] **Step 5: `src/Navbar.tsx`** — `Screen` + `'notif'`, item ativo/`onNavigate('notif')`; **`App.tsx`** — wordmark `notifs` + ramo `screen === 'notif' ? <NotificationScreen onOpenRestaurant={(c) => setRestaurantCnpj(c)} />`.

- [x] **Step 6: `npm test` + typecheck limpos.**

- [x] **Step 7: `docs/09/README.md`** + commit `feat: tela de notificações (mock)`.

### Task 3: Lista "quero ir" (saves compartilhados) — docs/10

**Files:**
- Create: `src/SavedScreen.tsx`, `src/SavedScreen.test.tsx`, `docs/10/README.md`
- Modify: `App.tsx` (estado `savedCnpjs`, camada, props), `src/RestaurantScreen.tsx` (+ `src/RestaurantScreen.test.tsx`), `src/ProfileScreen.tsx` (+ teste)

**Interfaces:**
- Produces: `export function SavedScreen({ cnpjs, onRemove, onOpenRestaurant, onBack }: { cnpjs: string[]; onRemove: (cnpj: string) => void; onOpenRestaurant: (cnpj: string) => void; onBack: () => void })` — linha = View com `Pressable` de abrir (testID `salvo-linha-{cnpj}`) + `Pressable` de remover (testID `salvo-tirar-{cnpj}`)
- `RestaurantScreen` passa a receber `saved: boolean; onSaveToggle: () => void` (estado local `saved` removido); testID `quero-ir` e copy `★ salvo`/`☆ quero ir` mantidos.
- `ProfileScreen` ganha props opcionais `savedCount?: number; onSavedList?: () => void` → chip `☆ quero ir · {N}` (testID `abrir-quero-ir`) na `versaoRow`, só quando `onSavedList` é passada.
- `App`: `const [savedCnpjs, setSavedCnpjs] = useState<string[]>([])`; `toggleSaved(cnpj)` (inclui/remove); `const [savedOpen, setSavedOpen] = useState(false)`; camada `<LayerScreen>` (condição `savedOpen`) contendo `SavedScreen`; RestaurantScreen recebe `saved={savedCnpjs.includes(restaurantCnpj)}`; ProfileScreen recebe `savedCount` + `onSavedList={() => setSavedOpen(true)}`; Navbar segue oculta com camada aberta.

- [x] **Step 1: Testes RED** (`SavedScreen.test.tsx`):
  1. `cnpjs=['09597505000150','33229301000140']` → 2 linhas `salvo-linha-{cnpj}`; nome `BAR DO LECO` presente; meta com `·` e `km`.
  2. Tocar `salvo-linha-09597505000150` → `onOpenRestaurant('09597505000150')`.
  3. Tocar `salvo-tirar-33229301000140` → `onRemove('33229301000140')`.
  4. `cnpjs=[]` → texto `salvo-vazio` com copy "ainda não salvou nenhum restaurante".
  5. `onBack` wired no botão `voltar`.

- [x] **Step 2: Confirmar FAIL.**

- [x] **Step 3: Implementar `SavedScreen`**: topbar (btn `←` testID `voltar` como no `RestaurantScreen`) + `SectionTitle` `quero ir · {n}`; cada linha = `View` (separador hairline) contendo **dois alvos independentes**: `Pressable` de abrir (nome `display800` 18 + meta de `restaurantFor`, testID `salvo-linha-{cnpj}`, press 0.85, `onPress={() => onOpenRestaurant(cnpj)}`) e botão circular `★` à direita (testID `salvo-tirar-{cnpj}`, `onPress={() => onRemove(cnpj)}`) — dois alvos evitam conflito de evento.

- [x] **Step 4: Atualizar `RestaurantScreen`** (props novas; remover `useState` local) **e seu teste** (render com `saved`/`onSaveToggle`; tocar `quero-ir` chama o callback; `saved=true` mostra `★ salvo`).

- [x] **Step 5: `ProfileScreen`** chip `abrir-quero-ir` + **teste** (com `onSavedList` → chip presente com count; sem → ausente; toque chama callback).

- [x] **Step 6: `App.tsx`** — estado, toggle, camada, wiring.

- [x] **Step 7: `npm test` + typecheck limpos.**

- [x] **Step 8: `docs/10/README.md`** (fonte única de saves, entrada pelo perfil) + commit `feat: lista "quero ir" (saves compartilhados com a página do restaurante)`.

### Task 4: Perfil ligado ao usuário ativo (N5) — docs/11

**Files:**
- Modify: `src/mockData.ts` (helper de identidade), `src/ProfileScreen.tsx` (+ `src/ProfileScreen.test.tsx`), `App.tsx`, `docs/11/README.md`

**Interfaces:**
- Produces: `export function displayName(userId: string): string` e `export function bioFor(userId: string): string` em `src/mockData.ts`.
- `ProfileScreen` ganha prop opcional `userId?: string` (default `'bea_come_tudo'`); identidade (Avatar, nome, handle `@{userId} · São Paulo`, bio) passa a derivar do `userId`; stats/favoritos/diário/listas seguem o mock `PERFIL` (conteúdo).

- [x] **Step 1: Testes RED** em `ProfileScreen.test.tsx`:
  1. `<ProfileScreen userId="mogli" />` → árvore contém `Mogli` e `@mogli`.
  2. Default (sem prop) → continua `Bea Ferraz` / `@bea_come_tudo`.
  3. `userId="user_1"` → nome `User 1` (fallback determinístico: trocas `_`/`.` por espaço, capitalize).

- [x] **Step 2: Confirmar FAIL.**

- [x] **Step 3: `mockData.ts`** — `displayName`: mapa conhecido (`bea_come_tudo`→`Bea Ferraz`, `renatocritico`→`Renato Crítico`, `caio.garfo`→`Caio Garfo`, `isa.mastiga`→`Isa Mastiga`, `juu.talher`→`Juu Talher`, `bruce`→`Bruce`, `mogli`→`Mogli`, `dosso`→`Dosso`, `lucas`→`Lucas`, `mock`→`Mock`) senão fallback capitalize de `userId.replace(/[._]+/g,' ')`; `bioFor`: `bea_come_tudo` → bio atual, demais → `"Comendo a cidade, um post de cada vez."`.

- [x] **Step 4: `ProfileScreen`** — substituir `PERFIL.userId`/`PERFIL.nome`/`PERFIL.handle`/`PERFIL.bio` (nos blocos v1 e v2) pelos derivados; **`App.tsx`** passa `userId={userId}`.

- [x] **Step 5: `npm test` + typecheck limpos.**

- [x] **Step 6: Atualizar `docs/07/README.md`** (remover busca/notif/quero-ir/N5 do backlog pendente; sobram: thread de comentários, upload real de foto, error boundary global) + `docs/11/README.md` + commit `feat: perfil reflete o usuário ativo (N5)`.
