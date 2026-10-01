# docs/05 — Nova avaliação (v2) + Página do restaurante

Implementação no app dos mocks `tim — nova avaliação (docs_04).html` e
`tim — página do restaurante (docs_05).html`.

## O que mudou

1. **Avaliar v1/v2** — a tela de composição ganhou seletor de versão
   (mesmo padrão do perfil): `avaliar v1` mantém o layout original
   (busca + botões 1–5), `avaliar v2` (padrão) é o mock docs_04.
2. **Avaliar v2** — local com "trocar", nota **0.0–10.0 em passos de 0.5**
   (slider horizontal com ticks e marca central rosa), foto opcional,
   legenda, flairs (máx. 2, primeiro sai quando entra o terceiro) e
   **preview ao vivo do quote card**.
3. **Página do restaurante** — cover com selo de nota, stats (nota média,
   avaliações, quero ir), botões `avaliar` / `quero ir` (toggle salvo),
   social proof, flairs agregados ("o que a galera diz") e avaliações
   **reaproveitando os componentes do feed** (linha compacta + quote card
   intercalado).
4. **Navegação** — toque em qualquer card de feed com CNPJ abre a página
   do restaurante; o botão `avaliar` dela abre a composição v1/v2 com o
   local já pré-selecionado.

## Arquivos

| Item | Onde |
|------|------|
| Seletor v1/v2 + tela v1 (antiga) | `src/ComposeScreen.tsx` |
| Tela v2 (slider, flairs, foto, preview) | `src/ComposeV2.tsx` |
| Slider de nota 0–10 (21 ticks) | `src/NoteSlider.tsx` |
| Mock da página do restaurante (determinístico por CNPJ) | `src/restaurantMock.ts` |
| Tela do restaurante | `src/RestaurantScreen.tsx` |
| `onPress` opcional nos cards de feed | `src/FeedCard.tsx`, `src/FeedQuote.tsx`, `src/FeedPhoto.tsx` |
| Roteamento (restaurante ↔ avaliar) | `App.tsx` (`restaurantCnpj` / `composeCnpj`) |
| Testes | `src/NoteSlider.test.tsx`, `src/ComposeV2.test.tsx`, `src/RestaurantScreen.test.tsx`, `src/restaurantMock.test.ts`, `src/ComposeScreen.test.tsx` (atualizado), testes dos cards (onPress) |

## Decisões (limitações da API atual)

- **Foto e flairs são só visuais**: `POST /reviews` continua com
  `cnpj + rating + comment`. A foto usa uma imagem de exemplo de
  `assets/posts`; os flairs ficam em estado local. Trocar quando a API
  ganhar esses campos.
- **Rating float**: a v2 envia `rating = nota / 2` (escala da API 0–5,
  passos de 0.25). O Postgres ainda guarda INTEGER — trocar a coluna
  p/ `NUMERIC(2,1)` (já anotado em `src/api.ts`).
- **Dados do restaurante**: a API não tem endpoint de
  restaurante/estatísticas → `restaurantFor(cnpj)` gera stats, flairs e
  reviews de forma **determinística** (mesmo CNPJ → mesma página), com o
  nome real do `restaurantNames` quando o CNPJ existe no seed.

Validação: `npm test` (94 testes) e `npm run typecheck` limpos.
