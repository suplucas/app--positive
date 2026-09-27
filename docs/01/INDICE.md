# docs/01 — UI/UX Documentation — tim

> Documentação de interface e experiência do usuário para o aplicativo "tim".
> Estrutura organizada por tópicos — conforme avançamos, criamos mais pastas dentro de `docs/`.

## Pastas e Arquivos Atuais

| Arquivo | Descrição |
|---------|-----------|
| `01-ui-ux-visual-language.md` | Paleta de cores, tipografia, espaçamento, estados de componentes, modo escuro, acessibilidade, Do's & Don'ts |
| `02-componentes-e-telas.md` | Visão geral dos módulos: Autenticação/Onboarding, Feed Principal, Registro de Experiência, Catálogo/Descoberta, Perfil/Retrospectiva, Navegação |
| `03-padroes-de-interacao.md` | Fluxo de feed e reordenação, regras de injeção de não-seguidos, cálculo de score, padrões do Compose Screen, estados de flair e navbar |
| `04-tokens-de-design.md` | Tokens de design (cores, espaçamento, tipografia, componentes) — fonte única de verdade |

## Como Navegar

- Cada arquivo é auto-contido com seus próprios tokens e definições.
- Tokens referenciados aqui derivam do `identidade_visual.md` e são implementados em `src/theme.ts`.
- Para novos tópicos, criar novos arquivos marcados com numeração sequencial (05-, 06-, etc.) ou criar subpastas conforme a documentação cresce.

## Próximos Passos Possíveis

- Criar pastas `02-prototipagem`, `03-animações`, `04-acessibilidade-testes`, etc.
- Documentar componentes React Native específicos.
- Adicionar wireframes ou mockups (browser-based visual companion).
- Documentar patterns de estado de loading, error, empty.

---
*Última atualização: $(date +%Y-%m-%d)*