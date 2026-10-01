# docs/16 — app completo (2): mapa, nova busca e seletor de nota

Pacote de features a partir do mock `docs/16/tim — app completo(2).html`.
Entregue em três commits: **mapa**, **nova busca**, **seletor de nota**.

## 1. Mapa (nova aba)

- **`src/mapMock.ts`**: `mapPlaces()` gera 5 lugares determinísticos
  (hash do CNPJ) a partir do seed — nome, nota (0–10), bairro,
  distância, **posição fracionária** (`x` 0.14–0.85, `y` 0.18–0.72) e
  **cor pela faixa de nota** (`>=8.5` mostarda · `>=6.5` lambe-lambe ·
  senão picles). Sem SDK de mapa.
- **`src/MapScreen.tsx`**:
  - `perto de você` → moldura estilizada (`mapa-moldura`): manchas de
    bairro translúcidas (sem lib de gradiente), **ponto "você"** escuro
    (`mapa-voce`) e **pins** gota coloridos com a nota
    (`mapa-pin-{cnpj}`).
  - `nessa área` → carrossel horizontal de cards (cor + nota, nome,
    `bairro · km`, `mapa-card-{cnpj}`).
  - Pin e card → `onOpenRestaurant(cnpj)` (página do restaurante em
    camada).
  - Rodapé: protótipo visual; mapa real usaria Google Maps/Mapbox.

## 2. Navbar: `mapa` no lugar de `notif.`

O mock troca o item da navbar. Agora: **feed · buscar · + · mapa ·
perfil**. As **notificações (docs/09)** não ficam órfãs — ganharam um
atalho **♡ (sino)** na linha do perfil (`abrir-notificacoes`), abertas
como **camada** (`LayerScreen`) sobre o perfil, com botão voltar.

## 3. Bug corrigido no caminho

`src/restaurantMock.ts` usava shift com sinal (`>>`) em campos de
faixa, o que podia gerar valores **negativos** (ex.: `distanciaKm` =
-2.2, mostrando "a -2.2km de você" na página do restaurante). Trocado
por `>>>` em rating/likes/createdAt/distância/bairro/preço/flairs.

## Testes

- `src/mapMock.test.ts`: 4–6 lugares, determinístico, posições na
  moldura, cor da paleta.
- `src/MapScreen.test.tsx`: seções + ponto "você", pin e card por
  lugar, pin mostra a nota e abre o restaurante, card abre, rodapé.
- `src/NotificationScreen.test.tsx`: botão voltar (camada).
- `src/ProfileScreen.test.tsx`: sino só com callback.

Validação parcial: `npm test` (172 testes) e `npm run typecheck`.
