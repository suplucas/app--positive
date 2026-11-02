# docs/09 — Tela de notificações (mock)

Item do backlog do audit (docs/07). Liga o item "notif." da navbar
(até então desativado) a uma tela funcional em mock.

## O que mudou

- **`src/notificationMock.ts`**: `AppNotification { id, icone, texto,
  cnpj?, createdAt }` + `MOCK_NOTIF` (4 itens: curtida na sua review,
  avaliação de quem você segue, novidades da sua lista "Quero Ir",
  novo seguidor). `createdAt` relativo via `hoursAgo`.
- **`src/NotificationScreen.tsx`**: lista de linhas (ícone + copy de
  produto + tempo relativo `formatRelative`), separadas por hairline.
  - Linha **com `cnpj`** = `Pressable` → `onOpenRestaurant(cnpj)`
    (página do restaurante em camada).
  - Linha **sem `cnpj`** = `View` inerte (sem callback pendurado).
  - Rodapé: "Notificações mock — entram com endpoint real."
- **`src/Navbar.tsx`**: `Screen` ganhou `'notif'`; item "notif." vira
  aba ativa de verdade.
- **`App.tsx`**: wordmark `notifs` + ramo de conteúdo; navbar continua
  visível (modelo de abas).

## Testes

`src/NotificationScreen.test.tsx`: 4 linhas renderizam, copy de
produto (autor + ação), linha com cnpj abre o CNPJ correto, linha sem
cnpj inerte, tempo relativo.

Validação: `npm test` (119 testes) e `npm run typecheck` limpos.
