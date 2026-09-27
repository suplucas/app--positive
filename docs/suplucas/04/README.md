# docs/04 — Perfil v2

Evolução da tela de perfil (`docs/03/perfil.html` → v1) com botão de seguir,
abas de conteúdo e fotos reais nos cards.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `perfil-v2.html` | Mockup autônomo do perfil v2 (fotos reais nos cards; avatar em cor sólida) |
| `tim — perfil v2 (docs_03).html` | Referência de design original (sem foto) |

## O que muda em relação ao v1

1. **Botão seguir/seguindo** ao lado do nome (alterna no toque).
2. **Abas de conteúdo** — `diário` (histórico) e `listas · 4` (curadoria).
3. **Aba listas** — cards com colagem 2×2 (1ª cor ocupa a coluna inteira) + título + meta.
4. **Fotos reais (exemplo)** — uma imagem de `assets/posts` em **1 favorito** e **1 post do diário**; o resto continua em cor sólida (inclusive o avatar).
5. Estante de favoritos com **3** itens (era 4).

## Implementação no app (React Native)

| Item | Onde |
|------|------|
| Tela v2 (seguir, abas, listas, colagem) | `src/ProfileScreen.tsx` |
| **Seletor de versão** (`perfil v1` / `perfil v2`) | `src/ProfileScreen.tsx` (`VersaoChip`) |
| Célula de diário com foto (`kind: 'photo'` / `photoIndex`) | `src/mockData.ts` + `src/ProfileScreen.tsx` |
| Favorito com foto (`photoIndex`) | `src/mockData.ts` + `src/ProfileScreen.tsx` |
| Fotos de exemplo (`MOCK_POST_PHOTOS`) | `src/postPhotos.ts` |
| Testes (seguir, abas, fotos, seletor) | `src/ProfileScreen.test.tsx` |

O **seletor de versão** (chips no topo do perfil, mesmo estilo do seletor
de usuários do feed) alterna entre:
- **perfil v1** — layout simples: avatar (72px) + nome + bio, stats, favoritos e diário;
- **perfil v2** (padrão) — o mock do `docs/04`: botão seguir, abas diário/listas e listas.

As fotos usam as imagens de exemplo (`assets/posts/`). Quando houver
endpoint de perfil, trocar o import mock pela URL real.

> O seletor de usuários no feed virou um `ScrollView` horizontal (uma linha
> só, sem quebrar em duas).

Validação: `npm test` (57 testes) e `npm run typecheck` limpos.
