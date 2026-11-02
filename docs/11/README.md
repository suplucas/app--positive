# docs/11 — Perfil reflete o usuário ativo (N5)

Item do audit (docs/07): o perfil exibia a Bea fixa
(`PERFIL` em `mockData`) não importava qual usuário estava "logado"
(na tela de configurações).

## O que mudou

- **`src/mockData.ts`**: helpers de identidade —
  - `displayName(userId)`: nome exibível por handle conhecido
    (`bea_come_tudo → Bea Ferraz`, `renatocritico → Renato Crítico`,
    …); desconhecidos ganham nome derivado
    deterministicamente (`user_1 → User 1`, `caio.x → Caio X` — nunca
    vazio).
  - `bioFor(userId)`: bio da Bea para ela; bio genérica
    ("Comendo a cidade, um post de cada vez.") para os demais.
- **`src/ProfileScreen.tsx`**: prop `userId?: string` (default
  `'bea_come_tudo'`). Identidade — **avatar** (cor derivada do
  hash do userId), **nome**, **handle** (`@{userId} · São Paulo`) e
  **bio** — agora deriva do `userId` nos layouts v1 e v2.
- **`App.tsx`**: passa `userId={userId}` (o mesmo estado que troca na
  tela de configurações).

## O que continua mock

Conteúdo de perfil (stats, favoritos, diário, listas, botão seguir)
segue o mock `PERFIL` — não há endpoint de perfil; só a **identidade**
ganhou fidelidade.

## Testes

`src/ProfileScreen.test.tsx` (describe "usuário ativo, N5"):
`mogli → Mogli/@mogli` (Bea some), `user_1 → User 1/@user_1`
(fallback), padrão continua Bea.

Validação: `npm test` (129 testes) e `npm run typecheck` limpos.
