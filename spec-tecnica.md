# **Especificação Técnica e Arquitetura \- Rede Social Gastronômica V2**

## ---

**1\. Visão Geral e Estratégia de Arquitetura**

Este documento detalha a arquitetura de software, decisões de infraestrutura, modelagem de dados e algoritmos para a implementação do MVP do aplicativo de experiências gastronômicas. A abordagem selecionada é a seguinte: React Native/Expo \+ Node.js/NestJS \+ PostgreSQL/PostGIS \+ Redis, acelerada pelo uso de IAs generativas de desenvolvimento.

Esta arquitetura foi escolhida por equilibrar agilidade no desenvolvimento mobile (base única para iOS e Android) com total controle no backend sobre o motor de busca geoespacial, gerenciamento de caches e o algoritmo de reordenação e injeção do feed, sem amarras de provedores BaaS (Backend-as-a-Service).

## **2\. Mapeamento da Aplicação e Telas (12 a 15 Fluxos)**

O aplicativo é composto pelos seguintes fluxos e interfaces essenciais:

| Módulo / Bloco | Telas e Componentes | Descrição Técnica   |
| :---- | :---- | :---- |
| **Autenticação & Onboarding** | Tela de Validação de Convite Cadastro e Configurações de Privacidade Onboarding Social (Importação de Conexões) | Validação de token de convite semente; alternância de conta pública/privada (com nota agregada anônima); sincronização e sugestão de contatos. |
| **Feed Principal** | Feed Unificado Reordenado Card de Check-in Rápido (1 linha) Card de Visita Completa (mídia e texto) | Feed dinâmico que reordena postagens de conexões e injeta descobertas qualificadas ("Quero Ir") com base em score em tempo real via Redis. |
| **Registro de Experiência** | Modal de Busca do Local Formulário de Postagem (Rápido vs. Completo) | Seleção do restaurante via busca local; nota opcional de 0 a 5 (meia estrela); uploads de fotos; data; acompanhantes e pratos. |
| **Catálogo & Descoberta** | Página Canonical do Restaurante Busca com Mapa Geoespacial Aba de Descoberta Social | Exibição de notas (Global vs. Rede), histórico de visitas do usuário e da rede; busca por proximidade; agregações ("Salvo por 3+ pessoas"). |
| **Perfil & Retrospectiva** | Perfil / Diário do Usuário Lista "Quero Ir" e Curadorias Tela "Espelho" (Retrospectiva) | Timeline histórica de visitas e evolução de notas; gestão da lista "Quero Ir"; estatísticas pessoais sem mecânicas competitivas/gamificadas. |

## **3\. Algoritmo de Reordenação e Recomendação do Feed**

O feed opera sob o princípio de **reordenação sem exclusão para a rede direta** e **injeção qualificada para não seguidos**.

### **3.1. Regras de Injeção de Pessoas Não Seguidas**

* **Lista "Quero Ir" (Permitido):** Se um restaurante está na lista "Quero Ir" do usuário, o algoritmo pode injetar avaliações de desconhecidos no feed. Exige-se que o post seja do tipo **Visita Completa** (foto \+ texto) e tenha **nota alta (\>= 4.0)**. O post recebe uma etiqueta explícita: *"Porque está na sua lista Quero Ir"*.  
* **Restaurantes Já Visitados (Bloqueado no Feed):** Avaliações de desconhecidos sobre locais que o usuário já visitou não entram no feed principal para evitar ruído. Essas postagens ficam restritas à Página Canonical do Restaurante.  
* **Regras Anti-Ad e Privacidade:** Nenhuma injeção pode ser paga ou patrocinada. Posts de perfis privados jamais são injetados para desconhecidos.

### **3.2. Cálculo de Score e Estratégia de Pesos (Heurística MVP)**

No MVP, os pesos são \*\*heurísticas determinísticas\*\* calibradas manualmente, e não modelos de ML treinados (evitando o problema de *Cold Start*). O score $S(u, p)$ é calculado por:

Score(u, p) \= (W\_affinity \* Affinity(u, author(p))) \+   
              (W\_effort \* Effort(p)) \+   
              (W\_interest \* Interest(u, restaurant(p))) \-   
              (W\_decay \* AgeDecay(p)) \- SeenPenalty(u, p)

* **Afinidade ($Affinity$):** Pontuação agregada pré-calculada e persistida no banco na tabela user\_affinity baseada nas interações dos últimos 30 dias (Curtida \= \+3, Comentário \= \+5, Salvar \= \+8). Se o autor não é seguido, $Affinity \= 0$.  
* **Esforço ($Effort$):** Visita Completa \= 50 pts; Check-in Rápido \= 10 pts.  
* **Interesse ($Interest$):** Bônus de \+30 pts se o restaurante estiver no "Quero Ir".  
* **Decaimento ($AgeDecay$):** Perda diária de pontuação para respeitar o teto de idade.

### **3.3. Arquitetura de Performance: Redis e Fan-out Híbrido**

Para evitar varrer e calcular o score de todos os posts do banco em tempo real, utiliza-se a estratégia de **Pre-computation e Fan-out no Redis**:

* **Push Model (Usuários Padrão \< 1.000 seguidores):** Ao postar, um worker em background calcula o score para cada seguidor ativo e injeta o \`visit\_id\` no **Redis ZSET** do seguidor (\`feed:user:{id}\`). A leitura do feed ocorre em \< 10ms via \`ZREVRANGEBYSCORE\`.  
* **Pull Model (Criadores Populares \> 1.000 seguidores):** O post não é distribuído massivamente. No momento da leitura, o backend mescla as caixas do Redis do usuário com as últimas postagens dos criadores grandes que ele segue.  
* **Trimming:** O Redis armazena no máximo 100-200 itens por usuário. Consultas mais antigas fazem fallback paginado ao PostgreSQL.

## **4\. Mecanismo de Busca e Reconciliação de Restaurantes**

A arquitetura divide a busca de restaurantes em duas frentes com objetivos distintos:

### **4.1. Busca de Catálogo e Pipeline de Reconciliação (Data Pipeline)**

O aplicativo não armazena fotos, horários ou avaliações de fontes externas para evitar violação de termos de uso e custos de API. Toda informação opinativa e visual pertence à comunidade.

**Fluxo de Reconciliação Espacial:**

1. Ao buscar um local para registro, a API recebe o texto e as coordenadas de GPS ($lat, lng$).  
2. **Busca Interna (PostGIS):** Consulta no PostgreSQL local via ordenação espacial por raio e busca textual aproximada (\`pg\_trgm\`).  
3. **Fallback & Inclusão Única:** Se não encontrar no banco local, chama a API do Google Places. Ao selecionar o resultado, salva localmente \*\*apenas\*\* Nome, Endereço, Coordenadas (PostGIS Geometry) e ID da Fonte. A partir daí, o restaurante é um dado autônomo do app e consultas futuras geram custo zero.

### **4.2. Busca por Rede Social (Descoberta)**

* **Proximidade da Rede:** Locais visitados recentemente por conexões dentro de um raio de $X$ km.  
* **Métrica de Desejo:** Locais salvos no "Quero Ir" por 3+ pessoas da rede.

## **5\. Modelagem do Banco de Dados (PostgreSQL \+ PostGIS)**

\-- Extensões  
CREATE EXTENSION IF NOT EXISTS postgis;  
CREATE EXTENSION IF NOT EXISTS pg\_trgm;

\-- Usuários  
CREATE TABLE users (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    name VARCHAR(255) NOT NULL,  
    email VARCHAR(255) UNIQUE NOT NULL,  
    is\_private BOOLEAN DEFAULT FALSE,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- Grafo Social Assimétrico  
CREATE TABLE follows (  
    follower\_id UUID REFERENCES users(id) ON DELETE CASCADE,  
    following\_id UUID REFERENCES users(id) ON DELETE CASCADE,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
    PRIMARY KEY (follower\_id, following\_id)  
);

\-- Tabela de Tabela de Afinidade Pré-calculada  
CREATE TABLE user\_affinity (  
    user\_id UUID REFERENCES users(id) ON DELETE CASCADE,  
    target\_user\_id UUID REFERENCES users(id) ON DELETE CASCADE,  
    affinity\_score NUMERIC(5, 2\) DEFAULT 0.0,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
    PRIMARY KEY (user\_id, target\_user\_id)  
);

\-- Restaurantes Canonical  
CREATE TABLE restaurants (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    name VARCHAR(255) NOT NULL,  
    address TEXT,  
    location GEOGRAPHY(Point, 4326\) NOT NULL,  
    external\_source\_id VARCHAR(255) UNIQUE,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- Visitas (Check-ins e Posts Completos)  
CREATE TABLE visits (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    user\_id UUID REFERENCES users(id) ON DELETE CASCADE,  
    restaurant\_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,  
    visit\_type VARCHAR(20) CHECK (visit\_type IN ('QUICK', 'COMPLETE')),  
    rating NUMERIC(2, 1\) CHECK (rating \>= 0 AND rating \<= 5),  
    review\_text TEXT,  
    visited\_at DATE NOT NULL DEFAULT CURRENT\_DATE,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- Lista Quero Ir  
CREATE TABLE want\_to\_go (  
    user\_id UUID REFERENCES users(id) ON DELETE CASCADE,  
    restaurant\_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
    PRIMARY KEY (user\_id, restaurant\_id)  
);

\-- Índices Espaciais e Textuais  
CREATE INDEX idx\_restaurants\_location ON restaurants USING GIST (location);  
CREATE INDEX idx\_restaurants\_name\_trgm ON restaurants USING GIST (name gist\_trgm\_ops);

## **6\. Estimativa de Custos de Infraestrutura e Esforço**

### **6.1. Estimativa de Custos Mensais de Infraestrutura (Fase MVP / Lançamento)**

| Serviço / Componente | Provedores Sugeridos | Custo Mensal Estimado   |
| :---- | :---- | :---- |
| **Servidor API (Node.js)** | Render, Fly.io, AWS App Runner | $0 a $15 / mês |
| **Banco de Dados (PostgreSQL \+ PostGIS)** | Supabase, Neon DB, AWS RDS | $0 a $25 / mês |
| **Cache & Filas (Redis Serverless)** | Upstash, Redis Enterprise Cloud | $0 a $10 / mês |
| **API de Restaurantes (Google Places)** | Google Maps Platform (apenas 1a consulta) | $0 a $20 / mês (após créditos grátis) |
| **Armazenamento de Mídia (Fotos)** | Cloudflare R2, AWS S3 | $1 a $5 / mês |
| **TOTAL MENSAL ESTIMADO** | **Infraestrutura de Nuvem Gerenciada** | **$0 a $75 / mês (\~R$ 0 a R$ 400/mês)** |

### **6.2. Esforço e Prazos de Desenvolvimento (Acelerado por IA)**

| Frente de Desenvolvimento | Escopo Principal | Esforço Estimado (com IA)   |
| :---- | :---- | :---- |
| **Frontend Mobile (React Native / Expo)** | Construção de todos os 12-15 fluxos, cards do feed, modais de busca, câmera/upload e estado do app. | 170 \- 220 horas |
| **Backend & Infraestrutura (Node.js / Postgres / Redis)** | Engine do feed (Push/Pull), rotas PostGIS, pipeline de reconciliação e tabela de afinidade. | 140 \- 190 horas |
| **QA, Refatoração & Testes de UX** | Ajuste das heurísticas de score, testes de carga no Redis e validação E2E. | 70 \- 90 horas |
| **TOTAL** | **MVP completo pronto para lançamento em loja** | **380 \- 500 horas** |

### **Projeção de Prazos por Tamanho de Equipe**

* **1 Desenvolvedor Full-stack Sênior \+ IA (Claude Code/Cursor):** \~3 a 3,5 meses.  
* **2 Desenvolvedores Seniores (1 Mobile \+ 1 Backend/DB) \+ IA:** \~2 a 2,5 meses.