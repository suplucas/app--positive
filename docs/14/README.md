# docs/14 — Error boundary global (E3)

Último item do audit do frontend (docs/07). Um erro de render em
qualquer tela não derruba o app inteiro: vira fallback de produto
com "tentar de novo".

## O que mudou

- **`src/ErrorBoundary.tsx`**: classe React com
  `getDerivedStateFromError` + `componentDidCatch` (logging — a UI
  **não** expõe detalhes técnicos, alinhado com o E1/E2).
  - Fallback (testID `erro-boundary`, `accessibilityRole="alert"`):
    "Ops, algo quebrou aqui." + "Nada do que você fez se perdeu…" +
    botão **tentar de novo** (`erro-boundary-retry`, alvo ≥ 44).
  - Cores neutras do `palette` (papel/berinjela/lambe-lambe) — sem
    `useTheme` na classe, fallback sempre legível em qualquer tema.
  - **Retry remonta as crianças** (`<View key={resetKey}>`): prova de
    remount, e não só "esconder o fallback" — estado interno
    corrompido é limpo.
- **`App.tsx`**: `<ThemeContext.Provider>` → `<ErrorBoundary>` →
  `SafeAreaView` (cobre header, conteúdo, camadas e navbar).

## Comportamentos fixados em teste

- Sem erro → children passam (zero overhead visível).
- **Erro permanente** no mount → fallback de produto; mensagem técnica
  (`boom…`) não vaza.
- **Erro transitivo** → o React 19 recupera a criança sozinho na
  re-render (fallback some sem ação do usuário) — comportamento
  documentado, não acidente.
- **Retry** → crianças remontam (contador de render sobe); erro
  persistente volta ao fallback de propósito.

Validação: `npm test` (151 testes) e `npm run typecheck` limpos.
