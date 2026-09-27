# Componentes e Telas — tim

## Visão Geral

O aplicativo "tim" possui os seguintes fluxos e interfaces essenciais, organizados por módulo:

### Módulo: Autenticação & Onboarding

- **Tela de Validação de Convite:** Validação de token de convite semente; alternância de conta pública/privada (com nota agregada anônima).
- **Cadastro:** Registro inicial de usuário.
- **Configurações de Privacidade:** Definição de conta pública/privada.
- **Onboarding Social:** Importação de conexões/sugestões de contatos.

### Módulo: Feed Principal

- **Feed Unificado:** Feed dinâmico que reordena postagens de conexões e injeta descobertas qualificadas ("Quero Ir").
- **Card de Check-in Rápido:** Card de 1 linha — visualização rápida.
- **Card de Visita Completa:** Card com mídia e texto — avaliação detalhada.

### Módulo: Registro de Experiência

- **Modal de Busca do Local:** Seleção do restaurante via busca local (PostGIS/Google Places fallback).
- **Formulário de Postagem:**
  - *Rápido:* Check-in rápido (10 pts de esforço).
  - *Completo:* Foto + texto + nota (0 a 5, meia estrela) + uploads de fotos + data + acompanhantes + pratos.

### Módulo: Catálogo & Descoberta

- **Página Canonical do Restaurante:** Exibição de notas (Global vs. Rede), histórico de visitas.
- **Busca com Mapa Geoespacial:** Busca por proximidade usando PostGIS.
- **Aba Descoberta Social:** Locais visitados recentemente por conexões dentro de um raio X km. Locais salvos no "Quero Ir" por 3+ pessoas da rede.

### Módulo: Perfil & Retrospectiva

- **Perfil / Diário do Usuário:** Timeline histórica de visitas e evolução de notas.
- **Lista "Quero Ir":** Gestão de restaurantes que o usuário quer visitar.
- **Curadorias:** Posts/curadorias do usuário.
- **Tela "Espelho" (Retrospectiva):** Estatísticas pessoais sem mecânicas competitivas/gamificadas.

## Navegação (Bottom Nav)

| Ícone/Label | Estado Ativo | Estado Inativo |
|-------------|--------------|----------------|
| Feed | Cor de texto plena, peso 600 | — |
| Buscar | — | Opacidade 50% |
| (+) Compose | — | — |
| Perfil | — | — |

> **Observação:** O botão "+" já segue o padrão de toque mínimo 44×44px.

---
*Documento vivo — atualizado conforme novos componentes e telas são desenvolvidos.*