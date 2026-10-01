# Backlog Restante Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar os 3 itens restantes do audit: thread de comentários (💬 dos cards), upload real de foto (picker) e error boundary global (E3).

**Architecture:** Comentários = mock determinístico por review + tela de thread em camada (`LayerScreen`), com composer local; foto = `expo-image-picker` com seam (`onPickPhoto`) testável e imagem real em URI local (a API não aceita foto — documentado); boundary = classe React com fallback de produto e "tentar de novo" (remount via key).

**Tech Stack:** RN/Expo SDK 57, React 19, Vitest + stubs (`vitest.config.ts`), PT-BR.

**Spec:** audit em `docs/07/README.md` (backlog restante); `docs/05` (compose: "foto e flairs são só visuais").

## Global Constraints

- TDD: RED → GREEN → `npm test` completo + `npm run typecheck` → commit `feat: …` por pacote.
- Press feedback 0.85; tokens de `src/theme.ts`; copy PT-BR de produto.
- Testes: padrão do repositório (`findByProps({ testID })`, `String(n.type) === 'Text'`, `act`).
- `docs/NN/README.md` por pacote (12→14); `docs/07/README.md` fecha o backlog ao final.

## Review Focus

- **Comentar com texto vazio:** o botão fica desabilitado — nunca entra comentário vazio na thread.
- **Picker cancelado:** a compose segue sem foto (estado anterior intacto), sem erro na UI.
- **Error boundary "recuperou":** após "tentar de novo", as crianças remontam de fato (key muda) — só ocultar o fallback não resolve estado interno corrompido.
- **Boundary não engolir o fallback próprio:** erro no próprio fallback não pode re-renderizar em loop (fallback é estático, sem dados dinâmicos).
- **💬 ausente quando não há `onComments`:** cards em RestaurantScreen (sem o callback) não mostram o botão — botão morto não volta.

---

### Task 5: Thread de comentários (💬 dos cards) — docs/12

**Files:**
- Create: `src/commentMock.ts`, `src/commentMock.test.ts`, `src/CommentThreadScreen.tsx`, `src/CommentThreadScreen.test.tsx`, `docs/12/README.md`
- Modify: `src/FeedCard.tsx` (+ teste), `src/FeedQuote.tsx` (+ teste), `src/FeedPhoto.tsx` (+ teste), `App.tsx`

**Interfaces:**
- Produces: `src/commentMock.ts` → `export type ReviewComment = { id: string; userId: string; text: string; createdAt: string }` + `export function commentsFor(reviewId: string): ReviewComment[]` (determinístico por hash — mesmo review → mesma thread; 2–4 itens; `createdAt` decrescente via `hoursAgo`).
- `CommentThreadScreen`: `export function CommentThreadScreen({ review, authorId, onBack }: { review: Review; authorId?: string; onBack: () => void })`.
- Cards: nova prop opcional `onComments?: () => void` em `FeedCard`/`FeedQuote`/`FeedPhoto`; quando presente, adiciona um `Pressable` "💬" com testID `comentar-{tipo}-{review.id}` (tipo = `card` | `quote` | `photo`).
- `App`: `const [commentReview, setCommentReview] = useState<Review | null>(null)`; `renderItem` passa `onComments={() => setCommentReview(item)}` aos 3 cards; camada no topo da pilha (após `savedOpen`): `commentReview && <LayerScreen><CommentThreadScreen review={commentReview} authorId={userId} onBack={() => setCommentReview(null)} /></LayerScreen>`; navbar oculta também com `commentReview` (condição junto com `savedOpen`).

- [ ] **Step 1: Testes RED** — `commentMock.test.ts`: mesmo `reviewId` → mesma lista (2 execuções iguais por deep-equal), 2 ≤ length ≤ 4, itens com `userId`/`text`/`createdAt` não vazios, `id` único na lista.
- [ ] **Step 2: Testes RED** — `CommentThreadScreen.test.tsx` (review base estilo `mockFeed`):
  1. Renderiza `comentario-original` (com autor da review + texto) e `{n}` linhas `comentario-{id}` (n = `commentsFor(id).length`).
  2. Digitar em `comentario-novo` + tocar `comentar` → texto aparece na árvore e um comentário com `userId === authorId` entra (comparar antes/depois de `findAll` por `comentario-`).
  3. Input vazio → `accessibilityState.disabled` de `comentar` é `true`.
  4. `voltar` chama `onBack`.
- [ ] **Step 3: Testes RED** — cards: em cada um dos 3, com `onComments` → botão `comentar-{tipo}-{id}` existe e toca o callback; sem `onComments` → ausente (5 linhas de teste: 3 positivos + reafirmação negativa no card).
- [ ] **Step 4: Confirmar FAIL** em todos.
- [ ] **Step 5: Implementar** `commentMock.ts` (pool de usuários de `restaurantMock` + pool de ~10 texts de comentário; hash estilo `restaurantFor`).
- [ ] **Step 6: Implementar** `CommentThreadScreen`: topbar `←` (`voltar`); `SectionTitle` `comentários · {n}`; header original (`comentario-original`: Avatar 40, handle, "em {restaurante}" via `restaurantName`, `getNote`, texto do comentário); lista (row: Avatar 26 + handle `display700` + texto + `formatRelative`); composer (`TextInput` `comentario-novo` + `Pressable` `comentar` desabilitado quando vazio — append local, não mutação do mock); rodapé "Comentários em modo demo — sincronizam quando houver endpoint."
- [ ] **Step 7: Cards** — `FeedCard`: 💬 na `meta` (depois do tempo); `FeedQuote`: 💬 ao lado do texto de ações; `FeedPhoto`: 💬 no `actions` (entre likes e salvar). testIDs `comentar-card-{id}` / `comentar-quote-{id}` / `comentar-photo-{id}`.
- [ ] **Step 8: App** — state + `onComments` nos 3 `renderItem` + camada + condição da navbar.
- [ ] **Step 9: `npm test` + typecheck limpos.**
- [ ] **Step 10: `docs/12/README.md`** + commit `feat: thread de comentarios (cards abrem a conversa da review)`.

### Task 6: Upload real de foto (picker) — docs/13

**Files:**
- Create: `src/pickPhoto.ts`, `docs/13/README.md`
- Modify: `package.json` (+ lockfile: `expo-image-picker`), `vitest.config.ts` (stub), `src/ComposeV2.tsx` (+ `src/ComposeV2.test.tsx`)

**Interfaces:**
- Produces: `src/pickPhoto.ts` → `export async function pickPhoto(): Promise<ImageSourcePropType | null>` (galeria; `quality: 0.8`; `canceled` ou sem asset → `null`).
- `ComposeV2`: nova prop opcional `onPickPhoto?: () => Promise<ImageSourcePropType | null>` (seam p/ testes; default = `pickPhoto` do módulo).
- Stub de teste: `vitest.config.ts` → quando `id` contém `expo-image-picker`, serve módulo `export const launchImageLibraryAsync = async () => ({ canceled: true, assets: [] });`.

- [ ] **Step 1: Dep** — `npx expo install expo-image-picker` (ou `npm i expo-image-picker` se a CLI não resolver); confirmar que `npm test` continua verde (o compose ainda não importa o módulo).
- [ ] **Step 2: Stub** no `vitest.config.ts` + smoke: `import { pickPhoto } from './pickPhoto'` num teste novo → `await pickPhoto()` === `null` (canceled no stub).
- [ ] **Step 3: Testes RED** em `ComposeV2.test.tsx`:
  1. Com `onPickPhoto: async () => 'file://demo/foto.jpg'`: tocar `foto-add` (await `act`) → `foto-preview` com `source === 'file://demo/foto.jpg'`.
  2. Com `onPickPhoto: async () => null`: tocar `foto-add` → `foto-preview` ausente (cancelamento mantém sem foto).
  3. Rotular: texto do estado com foto contém "local" (copy deixando claro que a foto não vai pra API).
- [ ] **Step 4: Confirmar FAIL.**
- [ ] **Step 5: Implementar** `pickPhoto.ts` + prop `onPickPhoto` no `ComposeV2` (onPress do `foto-add` → `void (onPickPhoto ?? pickPhoto)().then((src) => { if (src) setPhoto(src); })`); copys: botão "adicionar foto" + sub "da sua galeria · sem foto, vira um quote card"; estado com foto: "foto (só fica local até existir endpoint) · toque p/ remover".
- [ ] **Step 6: `npm test` + typecheck limpos.**
- [ ] **Step 7: `docs/13/README.md`** (o que é real: escolha + preview de URI; limitação: API sem campo de foto, POST inalterado) + commit `feat: foto real no compose (galeria via expo-image-picker)`.

### Task 7: Error boundary global (E3) — docs/14

**Files:**
- Create: `src/ErrorBoundary.tsx`, `src/ErrorBoundary.test.tsx`, `docs/14/README.md`
- Modify: `App.tsx`, `docs/07/README.md`

**Interfaces:**
- Produces: `export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; resetKey: number }>` — `getDerivedStateFromError` → `{ failed: true }`; `componentDidCatch` → `console.error`; fallback (testID `erro-boundary`) com copy "Ops, algo quebrou aqui." + `Pressable` `erro-boundary-retry` ("tentar de novo") que faz `setState({ failed: false, resetKey: prev + 1 })` e renderiza `<View key={resetKey}>{children}</View>` (remount de verdade).

- [ ] **Step 1: Testes RED**:
  1. Sem erro → children passam (texto da criança presente, sem `erro-boundary`).
  2. Criança que lança no mount → fallback (copy + testID presente; texto da criança ausente).
  3. Reset: criança que lança só na primeira vez (flag de módulo) → após tocar `erro-boundary-retry`, texto da criança volta.
- [ ] **Step 2: Confirmar FAIL.**
- [ ] **Step 3: Implementar** `ErrorBoundary` (fallback com cores neutras de `palette` — `papel`/`berinjela` — sem `useTheme` na classe; hit targets ≥ 44; `accessibilityRole="alert"` no wrapper do fallback).
- [ ] **Step 4: App** — `<ThemeContext.Provider>` → `<StatusBar/>` → `<ErrorBoundary>` envolvendo o `SafeAreaView` inteiro.
- [ ] **Step 5: `npm test` + typecheck limpos.**
- [ ] **Step 6: `docs/14/README.md`** + atualizar `docs/07/README.md` (backlog do audit 100% entregue; restam só pendências de backend: sync de comentários, upload de foto, endpoints de restaurante/perfil) + commit `feat: error boundary global com retry (E3)`.
