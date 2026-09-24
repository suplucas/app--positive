# tim — diferenciais (backlog de features futuras)

Documento vivo pra registrar ideias de diferencial exploradas nas conversas de produto, mas ainda não implementadas na UI. Cada feature tem: conceito, por que importa, complexidade/riscos, e status.

---

## 1. Selos de nicho (import de identidade de outros apps)

**Conceito:** em vez do usuário escrever "sou corredor" na bio, o app puxa dados reais de apps de estilo de vida (Strava é a referência) e transforma isso em selo automático no perfil — "correu 42km em setembro", "gym rat certificada", "streak de 5 semanas avaliando".

**Por que importa:** cruza duas identidades (estilo de vida + gosto por comida) que nenhum concorrente direto (Beli, Yelp) está explorando. Selo com dado real pesa mais que autodeclaração — funciona como um "verificado" informal.

**Complexidade / riscos:**

- Requer OAuth com Strava (ou outro provedor) e tratamento de permissão/revogação.
- Risco de diluir o app — precisa ficar como camada opcional, não pilar central.
- Necessário deixar claro visualmente o que é selo importado (fonte externa) vs. selo nativo do app, pra não parecer que o app inventou o dado.

**Ideias associadas:**

- Feed/recomendação filtrando por nicho ("lugares aprovados por corredores").
- Clubes cruzados ("corre e come").
- Match score ampliado (hoje só paladar; poderia cruzar estilo de vida também).

**Status:** removido da tela de perfil por ora — protótipo visual já existiu (badge com bolinha colorida indicando origem externa) e pode ser retomado quando a integração real for viável.

---

## 2. Push notification por localização (check-in automático)

**Conceito:** o app detecta, via geofencing + tempo de permanência (dwell time) cruzado com uma base de POI (Google Places/Foursquare), que o usuário esteve num restaurante, e dispara notificação pedindo a avaliação.

**Timing recomendado:** disparar **ao sair** do geofence, não ao entrar — menos invasivo, e ainda pega a experiência fresca na memória.

**Edge cases a resolver:**

- Delivery em casa não deve gerar notificação de "você foi a um restaurante" (cruzar com dado de sync de delivery, item 3).
- Praça de alimentação / shopping: POI ambíguo, pode exigir perguntar "qual desses?" em vez de assumir.
- Reunião de trabalho ou visita não-social: precisa ser fácil dispensar sem parecer punitivo (tipo notificação passivo-agressiva de streak).

**Complexidade / riscos:**

- Geofencing em background consome bateria e exige permissão de localização "sempre", que é fricção grande de onboarding.
- iOS/Android limitam quantos geofences um app monitora simultaneamente — não dá pra vigiar a cidade inteira.
- LGPD exige consentimento explícito e específico pra dado de localização, não pode estar escondido em termo de uso genérico.

**Versão leve pra MVP:** notificação única no fim do dia, perguntando se teve algum lugar novo, cruzando com histórico de localização já existente no aparelho (sem geofence ativo) — menos preciso, muito mais simples de construir.

**Status:** conceito validado na conversa, não prototipado visualmente ainda (falta desenhar tela de permissão + texto da notificação).

---

## 3. Sync com histórico de delivery (iFood, Uber Eats)

**Conceito:** importar o histórico de pedidos de apps de delivery como pré-preenchimento do diário do usuário.

**Por que importa:** resolve o problema de cold-start — usuário novo chega ao app já com dezenas de lugares "logados" sem digitar nada, em vez de uma tela vazia no dia 1.

**Complexidade / riscos:** depende de parceria/API oficial dos apps de delivery ou de o usuário conectar a própria conta; sem isso, tecnicamente inviável.

**Status:** ideia levantada, não avaliada tecnicamente ainda.

---

## 4. Leitura de nota fiscal / Pix (mais avançado)

**Conceito:** equivalente ao GPS automático do Strava — prova automática de que o usuário esteve no lugar e quanto gastou, via leitura de recibo ou nota fiscal eletrônica.

**Complexidade / riscos:** alta. Formato de NFC-e varia por estado, parsing de recibo é propenso a erro. Prioridade baixa até validar as ideias mais simples (itens 2 e 3).

**Status:** ideia especulativa, não priorizada.

---

## 5. Camada social competitiva (inspirada em Strava)

Pacote de ideias menores, todas de baixo esforço relativo:

- **Streaks** — "5 semanas seguidas avaliando", gamificação tipo Duolingo.
- **Ranking por bairro/cidade** — equivalente a "segmento" do Strava, mas geográfico.
- **Kudos = "garfada"** — reação com peso próprio em vez de curtida genérica, reforça o tom de voz da marca.
- **Import de grafo social** — puxar contatos do Instagram pra resolver o problema de app social vazio no primeiro dia.

**Status:** nenhuma prototipada ainda; "garfada" já existe como conceito de flair no feed (ver telas publicadas), pode virar essa reação.

---

## Priorização sugerida (na ausência de dados de usuário)

1. Sync com delivery (2) — maior impacto no cold-start, menor complexidade técnica relativa.
2. Push notification leve (versão MVP do item 2) — resolve fricção de "esquecer de avaliar" sem exigir geofencing pesado.
3. Selos de nicho — diferencial forte, mas pode esperar validação de que o público quer essa camada.
4. Leitura de nota fiscal/Pix — deixar pra depois, complexidade alta demais pra fase inicial.