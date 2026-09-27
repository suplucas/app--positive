# UI UX Visual Language — tim

> **A marca como um diário de bordo gastronômico.** A interface segue o princípio de *menos moldura, mais conteúdo*: um feed descontraído tipo Reddit, sem a "performance" visual do Instagram. Cada seção é um prato. Os temperos (cores) realçam a crítica, não o prato.

## 1. Paleta de Cores (Tokens de Marca)

As cores são inspiradas em condimentos e acompanhamentos — identificam o "sabor" da crítica, não o alimento em si.

| Token | Hex | Uso | Contraste ( Sobre berinjela ) |
|-------|-----|-----|------------------------------|
| **Berinjela** | `#241A22` | Fundo base, texto principal | ~11.8:1 (AAA) |
| **Papel** | `#FBF2E4` | Fundo claro, cards | — |
| **Mostarda** | `#F2A93B` | Destaque, CTA, ícones | ~4.6:1 (AA texto grande) |
| **Lambe-lambe** | `#E63E75` | Energia, opiniões fortes | — |
| **Picles** | `#7A9A3D` | Aprovado, estado positivo | — |

> **Modo Escuro:** Fundo neutro `#121212` (nunca berinjela). As cores mostarda/pink/picles mantêm-se idênticas, ganhando mais contraste ao redor.

## 2. Tipografia

| Token | Familia | Peso | Tamanho | Uso |
|-------|---------|------|---------|-----|
| **Display** | Bricolage Grotesque | 700/800 | — | Títulos, headlines |
| **Corpo** | Instrument Sans | 400/500/600 | — | Texto corporal, descrições |

> *Display fala, corpo ouve.* A crítica é sua, o restaurante é dos outros.

## 3. Espaçamento — Grid de 4px

| Token | Valor (px) | Contexto |
|-------|------------|----------|
| Micro | 4 | Ícones, padding mínimo |
| Interno | 8 | Espaçamento entre componentes |
| Padrão | 16 | Espaçamento padrão |
| Seção | 24 | Separador entre blocos maiores |
| Bloco | 32 | Margem de página/seção |

## 4. Estados dos Componentes

| Componente | Variante | Quando usar |
|------------|----------|-------------|
| **Flair** | boa pra ir só | Observação neutra — fundo baixo contraste, não compete com a foto |
| **Flair** | chorei de tão bom | Opinião forte — cor cheia, uso com moderação (máx. 1 por post) |
| **Nav item** | feed | Aba ativa — cor de texto plena, peso 600 |
| **Nav item** | buscar | Aba inativa — opacidade 50% |

## 5. Modo Escuro

- Fundo: `#121212` (neutro, não berinjela)
- Texto: `#F2F0EF`
- Cores de marca (mostarda/pink/picles): inalteradas nos dois modos — valem mais porque têm mais contraste ao redor

## 6. Acessibilidade

| Par | Contraste | Status |
|-----|-----------|--------|
| Berinjela sobre papel | ~11.8:1 | ✅ passa AA e AAA |
| Mostarda sobre berinjela | ~4.6:1 | ✅ passa AA texto grande/UI |
| Pink sobre papel | ~3.9:1 | ⚠️ ok ícone/badge, evitar texto corrido pequeno |

**Regras:**
- Toque mínimo de 44×44px em qualquer botão da navbar
- Nenhuma informação só por cor — nota numérica sempre acompanha o selo de flair
- Foto sangrando na borda, sem moldura
- Cards com borda/sombra tentando parecer "produto" ❌

## 7. Do's & Don'ts

| ✅ Fazer | ❌ Evitar |
|----------|----------|
| Flair com fundo de baixo contraste por padrão | Mais de um flair "forte" no mesmo post |
| Nota numérica sempre visível junto de qualquer selo | Cor de marca (berinjela) como fundo de tela cheia |
| Foto sangrando na borda, sem moldura | Cards com borda/sombra parecendo "produto" |

---
*Rascunho de direção visual — cores, tipografia e nomes prontos para virar logo e telas.*