# docs/06 — Tela de configurações

Tela de configurações acessível pelo perfil (botão ⚙ na linha do seletor
de versão). Mova para lá dois controles que viviam no header do feed.

## O que mudou

1. **Tela de configurações** (`src/SettingsScreen.tsx`) — sub-tela cheia
   (top bar com `voltar`, navbar escondida, mesmo padrão da página do
   restaurante), com duas seções:
   - **usuário** — chips dos usuários de demo (`DEMO_USERS` em
     `src/mockFeed.ts`), estado ativo, toca alterna;
   - **tema** — `sistema` (padrão, segue o sistema) / `claro` / `escuro`.
2. **Header do feed limpo** (`App.tsx`) — removeu o seletor de usuários
   (chips) e o botão de tema; restou a wordmark + banner de status.
3. **Entrada pelo perfil** — `ProfileScreen` ganhou prop opcional
   `onSettings` → botão ⚙ (aparece nas v1 e v2).

## Arquivos

| Item | Onde |
|------|------|
| Tela de configurações | `src/SettingsScreen.tsx` |
| Estado de usuário/tema + roteamento | `App.tsx` (`settingsOpen`, `themeMode`) |
| Botão ⚙ no perfil | `src/ProfileScreen.tsx` (prop `onSettings`) |
| `DEMO_USERS` (saiu do App p/ mockFeed) | `src/mockFeed.ts` |
| Testes | `src/SettingsScreen.test.tsx`, `src/ProfileScreen.test.tsx` (botão ⚙) |

## Notas

- `themeMode: 'system' | 'light' | 'dark'` — `system` (= `null` anterior,
  segue `useColorScheme`) é o padrão. O tema efetivo continua sendo
  `lightTheme`/`darkTheme` de `src/theme.ts`.
- Trocar usuário na tela de configurações atualiza o feed na volta
  (mesmo `useFeed(userId)` de sempre).

Validação: `npm test` (100 testes) e `npm run typecheck` limpos.
