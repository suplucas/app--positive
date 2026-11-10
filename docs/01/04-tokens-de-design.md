# Tokens de Design — tim (Design System)

> Fonte única de verdade para cores, tipografia e espaçamento. Todos os tokens derivam do `identidade_visual.md`.

## Cores da Paleta

```css
--color-berinjela: #241A22;     /* Fundo base, texto principal */
--color-papel: #FBF2E4;         /* Fundo claro, cards */
--color-mostarda: #F2A93B;      /* Destaque, CTA, ícones */
--color-lambe-lambe: #E63E75;  /* Energia, opiniões fortes */
--color-picles: #7A9A3D;        /* Aprovado, estado positivo */
```

## Modo Escuro

```css
--mode-dark: #121212;           /* Fundo neutro — NÃO berinjela */
--color-ink-dark: #F2F0EF;      /* Texto claro no escuro */
--color-sub-dark: rgba(242,240,239,0.55); /* Texto secundário */
--color-line-dark: rgba(242,240,239,0.09); /* Linhas de divisão */
--color-quiet-bg-dark: rgba(242,240,239,0.10); /* Fundo suave */
```

## Cores no Modo Escuro (invariantes)

As cores de marca mantêm-se idênticas nos dois modos:

```css
--color-mostarda-dark: #F2A93B;  /* Mesma hex, mais contraste ao redor */
--color-picles-dark: #7A9A3D;   /* Mesma hex */
```

## Escala de Espaçamento (Grid 4px)

```css
--spacing-micro: 4px;     /* Ícones, padding mínimo */
--spacing-interno: 8px;   /* Espaçamento entre componentes */
--spacing-medio: 12px;    /* Respiro intermediário */
--spacing-padrao: 16px;   /* Espaçamento padrão */
--spacing-grande: 20px;   /* Respiro entre grupos próximos */
--spacing-secao: 24px;    /* Separador entre blocos maiores */
--spacing-bloco: 32px;    /* Margem de página/seção */
```

## Tipografia

```css
--font-display: "Bricolage Grotesque", sans-serif; /* Títulos, headlines */
--font-corpo: "Instrument Sans", sans-serif;        /* Texto corporal */
--font-display-700: 700;                             /* Peso display */
--font-display-800: 800;                             /* Peso display extra-bold */
--font-corpo-400: 400;                               /* Peso regular */
--font-corpo-500: 500;                               /* Peso medium */
--font-corpo-600: 600;                               /* Peso semi-bold */
```

### Escala Tipográfica (`type`)

```css
--type-caption: 11px;     /* Legendas, metadados densos */
--type-small: 12px;       /* Texto auxiliar */
--type-body: 13px;        /* Texto corporal padrão */
--type-body-large: 14px;  /* Corpo em telas de leitura */
--type-title: 16px;       /* Título de item */
--type-heading: 18px;     /* Cabeçalho de seção */
--type-page: 22px;        /* Título de tela */
--type-hero: 30px;        /* Destaque editorial */
```

## Raios (`radius`)

```css
--radius-chip: 5px;       /* Chips e selos */
--radius-thumb: 10px;     /* Miniaturas */
--radius-card: 12px;      /* Cards */
--radius-panel: 16px;     /* Painéis e superfícies maiores */
--radius-pill: 999px;     /* Formato pílula */
```

> Meios-pixels são exceção óptica: use-os apenas para alinhar elementos a olho (ícones, traços), nunca como parte da grade.

## Componentes Específicos

### Flair Token

```css
--chip-boa-pra-ir-bg: rgba(36,26,34,0.1);    /* Fundo baixo contraste */
--chip-forte-bg: #241A22;                    /* Cor cheia, uso moderado */
--chip-forte-ink: #F2F0EF;                   /* Texto no flair forte */
```

### Navbar Token

```css
--nav-ativo-color: var(--color-berinjela);
--nav-ativo-peso: 600;
--nav-inativo-opacidade: 50%;
```

---
*Manter em sincronia com `src/common/theme.ts` e `identidade_visual.md`.*