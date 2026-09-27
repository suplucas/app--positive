# Visualização HTML — Tela de Perfil (Mobile First)

> Arquivo HTML autônomo para visualizar as diferentes disposições de perfil.
> Use `open docs/02/perfil-visualizacao.html` no navegador.

## Como usar

```bash
# Abrir no navegador padrão
open docs/02/perfil-visualizacao.html

# Ou servir via expo
npx expo start --web
```

O HTML usa apenas tokens da identidade "tim" (cores, fontes, espaçamento) e não
depende de nenhuma biblioteca React — puro HTML/CSS para aprovação visual rápida.

## Telas disponíveis

1. **Username-only** — visualização mínima
2. **Username + Foto** — layout compacto com avatar
3. **Stats** — linha de estatísticas do usuário
4. **Favoritos (Shelf)** — scroll horizontal de chips
5. **Diary Grid** — grid responsivo de 1 a 4 colunas
6. **Posts Grid** — grid de cards de posts

---
*Arquivo HTML de apoio para a implementação da tela de perfil.*