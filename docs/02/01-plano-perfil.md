# Plano de Implementação — Tela de Perfil (tim)

> Manter todas as cores e fontes já definidas no `identidade_visual.md` e `src/theme.ts`.
> Explorar diferentes modos de disposição de informações: lista, grid, username-only,
> com foto, grid de posts, etc.

## 1. Visão Geral

A tela de perfil do usuário ("Espelho" / Diário pessoal) deve ser uma retrospectiva
limpa, sem mecânicas competitivas/gamificadas, seguindo o princípio de *menos moldura,
mais conteúdo*. Todos os componentes devem usar os tokens do tema (berinjela, mostarda,
papel, texto claro no escuro).

## 2. Modes/Layouts de Disposição

### 2.1. Username-only (Minimalista)
- Apenas nome de usuário e handle
- Sem foto, sem stats, mínima informação
- Use caso: estado de loading, versão inicial

### 2.2. Username + Foto (Compacta)
- Avatar 64×64 à esquerda
- Nome e handle à direita
- Bio em linha única
- Use caso: visualização resumida do feed

### 2.3. Username + Stats (Card institucional)
- Foto + nome + handle
- Linha de stats: avaliações, seguidores, seguindo, média
- Stats em bloco horizontal com ícones mínimos
- Use caso: perfil institucional, "Sobre"

### 2.4. Perfil Completo (Com Diary / Daily)
- Todas as seções do layout atual: bio, stats, favoritos, diario
- Diary organizado em grid responsivo (1 a 4 colunas dependendo do width)
- Favoritos em scroll horizontal tipo "shelf"

### 2.5. Posts Grid (Timeline Invertida)
- Área superior: dados do usuário (foto, nome, stats)
- Área inferior: grid de posts/visitas do usuário
- Cada card do post pode ser quick check-in ou completa (com foto + nota)
- Use caso: retrospectiva visual do usuário

## 3. Estrutura de Dados (mock)

Manter compatibilidade com `src/mockData.ts`:

```typescript
export const PERFIL = {
  userId: "bea_come_tudo",
  nome: "Bea Ferraz",
  handle: "@bea_come_tudo · São Paulo",
  bio: "Crítica de fim de semana. Se a fila for grande, provavelmente eu tô nela.",
  stats: [
    { n: "184", l: "avaliações" },
    { n: "92", l: "seguidores" },
    { n: "76", l: "seguindo" },
    { n: "9.1", l: "média" },
  ],
  favoritos: [...], // items with cor and nota
  diario: [...], // items with cor and nota
  posts: [...], // futura adição: posts do usuário
};
```

## 4. Tokens/Estilos para Manter

```css
/* Cores do tema (já definidas) */
--color-berinjela: #241A22;     /* Texto principal */
--color-papel: #FBF2E4;         /* Fundo claro */
--color-mostarda: #F2A93B;      /* Destaque / CTA */
--color-lambe-lambe: #E63E75;  /* Opinião forte */
--color-picles: #7A9A3D;        /* Aprovado */

/* Espaçamento */
--spacing-micro: 4px;
--spacing-interno: 8px;
--spacing-padrao: 16px;
--spacing-secao: 24px;
--spacing-blocO: 32px;

/* Tipografia */
--font-display: "Bricolage Grotesque";
--font-corpo: "Instrument Sans";
```

## 5. Plano de Implementação (Fases)

### Fase 1 — Fundação (Já existente)
- [x] `ProfileScreen.tsx` com layout básico
- [x] Uso de `useTheme()` para cores
- [x] `StyleSheet` com tokens de espaçamento

### Fase 2 — Layouts Responsivos
- [ ] Criar variantes do ProfileScreen para cada mode
- [ ] Implementar grid responsivo do diary (1 a 4 colunas)
- [ ] Implementar favaroritos em shelf horizontal
- [ ] Adicionar suporte à foto de perfil (Avatar component já existe)

### Fase 3 — Visualização de Posts
- [ ] Adicionar seção de posts do usuário
- [ ] Grid de cards (quick vs complete)
- [ ] Estado empty/states de loading

### Fase 4 — Integração com API
- [ ] Substituir `PERFIL` mock por endpoint real `/profile/:userId`
- [ ] Mantener fallback mock durante transição

## 6. HTML de Visualização (Mobile First)

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>tim — Perfil do Usuário</title>
  <style>
    :root {
      --bg: #FBF2E4;
      --ink: #241A22;
      --mostarda: #F2A93B;
      --papel: #FFFFFF;
      --border: rgba(36,26,34,0.10);
      --radius: 6px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Instrument Sans", sans-serif;
      background: var(--bg);
      color: var(--ink);
      min-height: 100vh;
      padding: 20px;
    }

    h1 { font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; font-size: 1.25rem; margin-bottom: 4px; }
    .handle { font-size: 0.75rem; color: rgba(36,26,34,0.6); margin-bottom: 8px; }

    .bio { font-size: 0.8rem; margin: 12px 0; line-height: 1.5; }

    .stats { display: flex; gap: 24px; padding: 24px 0; border-bottom: 1px solid var(--border); border-top: 1px solid var(--border); }
    .stat { text-align: center; flex: 1; }
    .stat-n { font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; font-size: 1.25rem; }
    .stat-l { font-size: 0.7rem; color: rgba(36,26,34,0.5); margin-top: 2px; }

    .shelf { display: flex; gap: 8px; overflow-x: auto; padding: 16px 0; }
    .shelf > * { flex: 0 0 auto; width: 60px; aspect-ratio: 1; border-radius: 6; background: #E8E6E3; display: flex; align-items: center; justify-content: center; color: var(--ink); }
    .shelf > * .note { font-size: 1.5rem; }

    .diary { padding: 24px 0; }
    .diary-row { display: flex; gap: 4px; }
    .diary-cell { flex: 1; aspect-ratio: 1; border-radius: 6; background: #F5F4F2; display: flex; align-items: center; justify-content: center; color: var(--ink); font-size: 0.7rem; }

    .post-card { background: var(--papel); border-radius: var(--radius); padding: 12px; margin: 8px 0; }
    .post-card .author { font-size: 0.65rem; color: rgba(36,26,34,0.5); margin-bottom: 4px; }
    .post-card .rating { color: var(--mostarda); font-weight: 700; }
  </style>
</head>
<body>

  <!-- Modo 1: Username-only -->
  <div style="text-align: center; padding: 40px 20px;">
    <div style="width: 80px; height: 80px; background: var(--mostarda); border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem;">TIM</div>
    <h1>Bea Ferraz</h1>
    <p class="handle">@bea_come_tudo · São Paulo</p>
  </div>

  <!-- Modo 2: Username + Foto -->
  <div style="max-width: 360px; margin: 20px auto; background: var(--papel); border-radius: 8px; padding: 20px;">
    <div style="width: 64px; height: 64px; background: #CCC; border-radius: 50%; margin-right: 12px; flex-shrink: 0;"></div>
    <div>
      <h1 style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 1.25rem;">Bea Ferraz</h1>
      <p class="handle">@bea_come_tudo · São Paulo</p>
      <p class="bio">Crítica de fim de semana. Se a fila for grande, provavelmente eu tô nela.</p>
    </div>
  </div>

  <!-- Modo 3: Stats -->
  <div style="max-width: 360px; margin: 20px auto;">
    <div class="stats">
      <div class="stat"><div class="stat-n">184</div><div class="stat-l">avaliações</div></div>
      <div class="stat"><div class="stat-n">92</div><div class="stat-l">seguidores</div></div>
      <div class="stat"><div class="stat-n">76</div><div class="stat-l">seguindo</div></div>
      <div class="stat"><div class="stat-n">9.1</div><div class="stat-l">média</div></div>
    </div>
  </div>

  <!-- Modo 4: Favoritos (Shelf) -->
  <div style="max-width: 360px; margin: 20px auto;">
    <div style="padding: 0 16px 16px;">
      <span style="font-size: 0.75rem; color: rgba(36,26,34,0.5); margin-bottom: 8px;">Favoritos</span>
    </div>
    <div class="shelf">
      <div class="note">9.6</div>
      <div class="note">9.4</div>
      <div class="note">9.2</div>
      <div class="note">9.0</div>
    </div>
  </div>

  <!-- Modo 5: Diary Grid (4 colunas) -->
  <div style="max-width: 360px; margin: 20px auto;">
    <div style="padding: 0 16px;">
      <span style="font-size: 0.75rem; color: rgba(36,26,34,0.5); margin-bottom: 8px;">Diário</span>
    </div>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr; gap: 4px;">
      <div class="diary-cell">9.1</div>
      <div class="diary-cell">4.6</div>
      <div class="diary-cell">7.8</div>
      <div class="diary-cell">8.4</div>
      <div class="diary-cell">6.9</div>
      <div class="diary-cell">9.6</div>
      <div class="diary-cell">5.2</div>
      <div class="diary-cell">8.9</div>
    </div>
  </div>

  <!-- Modo 6: Posts Grid -->
  <div style="max-width: 360px; margin: 20px auto;">
    <div style="padding: 0 16px 16px;">
      <span style="font-size: 0.75rem; color: rgba(36,26,34,0.5); margin-bottom: 8x;">Posts</span>
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr; gap: 8px;">
      <div class="post-card">
        <div class="author">Boteco da Ana</div>
        <div class="rating">9.4</div>
      </div>
      <div class="post-card">
        <div class="author">Sushi Kaza</div>
        <div class="rating">8.9</div>
      </div>
      <div class="post-card">
        <div class="author">Empório Real</div>
        <div class="rating">8.2</div>
      </div>
      <div class="post-card">
        <div class="author">Boteco da Ana</div>
        <div class="rating">9.4</div>
      </div>
    </div>
  </div>

</body>
</html>
```

## 7. Diretrizes Visuais

- **Foto de perfil:** Avatar 64×64, fundo mostarda ou berinjela dependendo do tema
- **Border radius:** 6px para cells, 8px para containers maiores, 50% para avatar circular
- **Contraste:** Texto berinjela sobre papel (~11.8:1), mostarda sobre berinjela (~4.6:1)
- **Modo escuro:** Fundo #121212 (neutro), texto #F2F0EF, cores de marca inalteradas
- **Toque mínimo:** 44×44px em elementos interativos (botões, links)
- **Sem informação só por cor:** Nota numérica sempre visível junto do flair/selo

## 8. Próximos Passos

1. Revisar este plano e confirmar quais modes/layouts são prioritários
2. Criar componentes variantes ou props no `ProfileScreen.tsx`
3. Implementar grid responsivo do diary (1 a 4 colunas via CSS clamp/media queries)
4. Substituir mock por API real quando disponível
5. Testar em diferentes larguras de tela (320px a 480px mobile)

---
*Plano criado em conformidade com a identidade visual "tim" e a especificação técnica existente.*