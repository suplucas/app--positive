# docs/13 — Foto real no compose (galeria)

Item do backlog do audit (docs/07). O "adicionar foto" do compose v2
parava de usar a foto de exemplo de `assets/posts` e agora abre a
**galeria do device** (`expo-image-picker`), exibindo a imagem real
em URI local.

## O que mudou

- **Dep**: `expo-image-picker` (`npx expo install`, versão de SDK 57).
- **`src/pickPhoto.ts`**: `pickPhoto(): Promise<ImageSourcePropType |
  null>` — `launchImageLibraryAsync({ quality: 0.8 })`; cancelado/sem
  asset → `null`. Source no formato **objeto** `{uri}` (string crua
  saiu do tipo no RN 0.86).
- **`src/ComposeV2.tsx`**: prop opcional `onPickPhoto` (seam p/
  testes — default = `pickPhoto` real). Botão "adicionar foto" chama a
  seam; resultado `null` (cancelou) não muda nada. Cópys atualizadas:
  - vazio: "da sua galeria · sem foto, vira um quote card";
  - com foto: "sua foto (só fica local até existir endpoint) · toque
    p/ remover".
- **`vitest.config.ts`**: stub de `expo-image-picker` (picker "cancele"
  por padrão; os testes injetam o resultado pela seam).

## O que é real vs. limitação

- **Real**: escolha na galeria, qualidade reduzida, preview da URI do
  device na tela de compose (inclusive trocar/remover).
- **Limitação (documentada desde docs/05)**: a API não tem campo de
  foto — o `POST /reviews` continua `cnpj + rating + comment`, e a
  imagem não sai do app. O rodapé do estado de foto diz isso sem
  escondê-lo.

## Testes

`src/ComposeV2.test.tsx` ("foto real, docs/13"): picker escolhido →
`foto-preview` com a URI; cancelado → segue sem foto; copy de local;
teste antigo "foto não entra no POST" agora injeta pela seam.

Validação: `npm test` (147 testes) e `npm run typecheck` limpos.
