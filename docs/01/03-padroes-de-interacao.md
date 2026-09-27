# Padrões de Interação e Fluxo — tim

## 1. Fluxo de Feed e Reordenação

O feed opera sob o princípio de **reordenação sem exclusão para a rede direta** e **injeção qualificada para não seguidos**:

### Regras de Injeção de Pessoas Não Seguidas

- **Lista "Quero Ir" (Permitido):** Se um restaurante está na lista "Quero Ir" do usuário, o algoritmo pode injetar avaliações de desconhecidos no feed. Exige-se que o post seja do tipo **Visita Completa** (foto + texto) e tenha **nota alta (>= 4.0)**. O post recebe uma etiqueta explícita: *"Porque está na sua lista Quero Ir"*.

- **Restaurantes Já Visitados (Bloqueado no Feed):** Avaliações de desconhecidos sobre locais que o usuário já visitou não entram no feed principal para evitar ruído. Essas postagens ficam restritas à Página Canonical do Restaurante.

- **Regras Anti-Ad e Privacidade:** Nenhuma injeção pode ser paga ou patrocinada. Posts de perfis privados jamais são injetados para desconhecidos.

### Cálculo de Score e Estratégia de Pesos (Heurística MVP)

No MVP, os pesos são heurísticas determinísticas calibradas manualmente:

```
Score(u, p) = (W_affinity × Affinity(u, author(p))) +
              (W_effort × Effort(p)) +
              (W_interest × Interest(u, restaurant(p))) -
              (W_decay × AgeDecay(p)) -
              SeenPenalty(u, p)
```

- **Afinidade:** Pontuação agregada pré-calculada no banco (Curtida=+3, Comentário=+5, Salvar=+8). Se o autor não é seguido, Affinity=0.
- **Esforço:** Visita Completa=50 pts; Check-in Rápido=10 pts.
- **Interesse:** Bônus de +30 pts se o restaurante estiver no "Quero Ir".
- **Decaimento:** Perda diária de pontuação para respeitar o teto de idade.

## 2. Padrões de Compose Screen (Registro de Experiência)

### Modal de Busca do Local

1. Usuário digita nome ou localização do restaurante.
2. Busca interna (PostGIS) por raio e busca textual (~pg_trgm).
3. Se não encontrar localmente → fallback Google Places.
4. Ao selecionar → salva apenas: Nome, Endereço, Coordenadas (PostGIS Geometry), ID da Fonte.
5. A partir daí, o restaurante é um dado autônomo do app (consultas futuras custam zero).

### Formulário de Postagem — Quick vs. Complete

| Campo | Quick | Complete |
|-------|-------|----------|
| Nota | Opcional (0 a 5) | Obrigatório (0 a 5, meia estrela) |
| Foto | Opcional | Obrigatório |
| Acompanhantes | Não disponível | Sim |
| Pratos | Não disponível | Sim |
| Local | Busca obrigatória | Busca obrigatória |
| Data | Auto-preenchido | Auto-preenchido |

## 3. Estados de Componentes Específicos

### Flair

Indica o status da opinião visualmente:

- **boa pra ir só:** Fundo baixo contraste, não compete com a foto. Observação neutra.
- **chorei de tão bom:** Cor cheia, uso com moderação (no máximo 1 por post). Indica opinião forte.

### Card de Feed

- Foto sangrando na borda, sem moldura.
- Nota numérica sempre visível junto de qualquer selo de flair.
- Autor e restaurante aparecem como metadados secundários.

### Navbar (Bottom Navigation)

- Item ativo: cor de texto plena, peso 600.
- Item inativo: opacidade 50%.
- Botão "+" flutuante: toque mínimo 44×44px.

## 4. Navegação entre Telas

- **Feed → Perfil:** Tap no avatar do usuário ou ícone de perfil.
- **Feed → Buscar:** Tap no ícone de lupa na navbar.
- **Feed → Compose (Postagem):** Tap no botão "+" na navbar.
- **Card de Visita Completa → Detalhes do Restaurante:** Tap no nome do restaurante ou foto.
- **Busca → Página Canonical do Restaurante:** Seleção do resultado da busca.

---
*Documento vivo — atualizado conforme novos fluxos e padrões de interação são desenvolvidos.*