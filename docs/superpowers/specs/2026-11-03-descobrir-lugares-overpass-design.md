# Descobrir lugares ao redor (Overpass) + mapa em duas camadas + Nominatim local — design

**Data:** 2026-11-03
**Status:** proposta para revisão
**Repos:** `api--positive--feed` (NestJS) e `app--positive` (Expo/React Native), + `docker-compose` da raiz
**Base:** busca por Nominatim, catálogo `restaurants`, `GET /places?bbox=`, mapa Leaflet/WebView e `POST /places/import` já existentes.

## 1. Contexto

Hoje o mapa lista **apenas restaurantes do catálogo que já têm review e
coordenadas** (`PlaceMapService.list`), com bbox fixo no app
(`usePlaces`/`DEFAULT_BBOX`); ele não reage ao arrasto nem descobre
lugares. A busca já usa Nominatim atrás da API (`PlaceService`), e o
Nominatim de produção já está hospedado no Railway do dono.

Queremos transformar o mapa em **descoberta**: mostrar cafés, bares e
restaurantes ao redor da área visível, usando o **Overpass API**, com o
resultado persistido no catálogo e desenhado em **duas camadas de pins**
(descoberta x social). Para o desenvolvimento local, sobe-se um
**Nominatim self-host** via docker-compose.

## 2. Objetivos

- Descobrir `amenity=restaurant|cafe|bar` na área visível do mapa via
  Overpass, com o app disparando a consulta ao **arrastar/parar** o mapa.
- Persistir todo POI descoberto no catálogo `restaurants` (upsert
  idempotente por `osm_id`), para revisitas instantâneas e para alimentar
  busca/social depois.
- **Cache em ambas as camadas**: Redis (resposta da área) + Postgres
  (catálogo).
- **Duas camadas de pins** no mesmo mapa: social (`nota != null`, cor da
  marca + número) e descoberta (`nota == null`, ponto neutro).
- Qualquer pin abre a página do restaurante (a descoberta já está
  persistida, então navega direto).
- Rodar local com **Nominatim self-host** no docker-compose.

## 3. Não-objetivos

- Self-host do Overpass (segue a instância pública).
- Adapters para providers comerciais (Geoapify/LocationIQ) e `OSM_API_KEY`
  — o Nominatim é self-hosted, não precisa de chave.
- Clustering/heatmap de pins, offline, rota a pé/carro.
- Filtro por tipo na UI (café/bar/restaurante), ordenação por distância,
  "aberto agora".

## 4. Decisões (do brainstorm)

- Overpass em produção = **API pública**, acessada **só pela API** (proxy).
- Compose local = **Nominatim só** (Overpass segue público).
- Extract local do Nominatim = **Sudeste/SP** (PBF configurável).
- Persistência = **upsert de tudo que for descoberto** no Postgres.
- Interação = **qualquer pin abre a página** do restaurante.
- Endpoint = **um só**: ampliar `GET /places?bbox=` (opção A).

## 5. Arquitetura e fluxo

```
App (mapa) --moveend (debounce 700ms)--> GET /places?bbox=...
                                           │
                    PlaceController.map
                       │  refreshArea(bbox)  [best-effort]
                       │    ├─ Redis cache da área (hit → pula Overpass)
                       │    └─ miss → OverpassClient.around(bbox)
                       │              → upsert restaurants (id=osm:...)
                       ▼
                    PlaceMapService.list(bbox)   // lê Postgres + notas
                       ▼
        pins: [{ id, nome, lat, lng, nota|null, bairro, source }]
App desenha 2 camadas por `nota`.
```

- Toda leitura é do Postgres (instantânea). O Overpass só é tocado em
  **cache-miss** de área.
- Falha/timeout/rate-limit do Overpass → ainda devolve o Postgres
  (degradação suave).

## 6. API — contratos

### `GET /places?bbox=minLng,minLat,maxLng,maxLat&limit=200` (ampliado)
- `@Public()`.
- Validações: 4 números finitos, `minLng < maxLng`, `minLat < maxLat`;
  **área máxima** de `OVERPASS_MAX_BBOX_SPAN_DEG` (ex.: `0.25°`) por lado
  → `400 BadRequest 'área grande demais'`.
- Comportamento:
  1. `placeDiscoveryService.refreshArea(bbox)` — best-effort (catch).
  2. `placeMapService.list(bbox, limit)` — sempre.
- Resposta: `{ results: PlacePin[] }` com
  `PlacePin = { id, nome, lat, lng, nota: number|null, bairro: string|null, source: 'seed'|'osm' }`.
- `nota == null` → camada de descoberta.

### `POST /places/import` (mantido)
Inalterado (dedupe por `osm_id`). Vira caminho secundário: o upsert da
descoberta já popula o catálogo.

### Fixes de integração (necessários para "qualquer pin abre")
- `RestaurantController`: `@Get('/restaurants/:cnpj')` →
  `@Get('/restaurants/:id')` e `@Param('cnpj')` → `@Param('id')` (idem
  para `/reviews`), pois o parâmetro atual não casa e chega `undefined`.
- `RestaurantScreen` (app): habilitar `useRestaurant` também quando
  `cnpj` começa com `osm:` (agora persistido); usar o fallback OSM
  (`osmPlace`) só quando a API falhar; mensagem de "não encontrei" só
  quando não houver nem API nem `osmPlace`.

## 7. Overpass — cliente, cache e limites

### `infrastructure/osm/OverpassClient.ts` (novo)
```ts
export type OverpassConfig = {
  baseUrl: string;      // OVERPASS_URL
  userAgent: string;    // OSM_USER_AGENT
  timeoutMs: number;    // OVERPASS_SEARCH_TIMEOUT_MS
  amenities: string;    // OVERPASS_AMENITIES (regex)
};
export type DiscoveryPlace = {
  id: string;           // osm:<type>/<id>
  nome: string;
  categoria: string | null; // valor de amenity
  lat: number;
  lng: number;
};
export class OverpassClient {
  around(bbox: Bbox): Promise<DiscoveryPlace[]>;
}
```
Query (POST no `baseUrl`, `data=`):
```
[out:json][timeout:{s}];
nwr["amenity"~"^(restaurant|cafe|bar)$"]({minLat},{minLng},{maxLat},{maxLng});
out center tags;
```
Parser: node → `lat/lon`; way/relation → `center.lat/lng`; **ignora sem
`tags.name` ou sem coordenada**; dedupe por `id`; `categoria = tags.amenity`.
Headers: `User-Agent: <OSM_USER_AGENT>`, `Accept: application/json`.
Uma tentativa de retry com backoff curto em 429/5xx (opcional).

### `PlaceDiscoveryService` (novo, `application/service`)
Responsabilidade nova e coesa: **Overpass + cache de área + upsert**.
```ts
async refreshArea(bbox: Bbox): Promise<void>;
```
- **Cache**: chave `osm:overpass:{sha1(gridBbox)}`, `EX = OVERPASS_CACHE_TTL_S`.
  `gridBbox` = bbox “snapeada” numa grade de `0.005°` (floor min/ceil max)
  para aumentar hits. `get` antes de tocar o Overpass; `set` depois.
- **Rate-limit**: mesmo padrão do `PlaceService.acquireOsmSlot`
  (`SET osm:overpass:ratelimit NX PX OVERPASS_MIN_INTERVAL_MS`); se o
  slot não sair dentro de `OVERPASS_MAX_WAIT_MS`, **pula** o Overpass.
- **Upsert**: `restaurants.upsert(rows, ['id'])` em lote:
  `{ id, source:'overpass', osmId:id, nomeFantasia:nome, tipo:categoria, lat, lng, geocodedAt: now }`.
- Falha → loga e retorna (não derruba o request).

### `PlaceMapService.list(bbox, limit)` (ampliado)
- Lê **todos** os `restaurants` na bbox (lat/lng não nulos), ordena
  (ex.: por `nomeFantasia`), `take limit`.
- Calcula `nota` das reviews por id (média 0–5 → 0–10) — `null` quando
  não há review.
- Devolve `source` da linha.

## 8. Persistência

Sem migration nova: usa `restaurants` (`id` PK, `source`, `osm_id` único
parcial, `nome_fantasia`, `tipo`, `lat`, `lng`, `geocoded_at`).
`source='seed'` não é sobrescrito. Upsert idempotente por `id`.

## 9. App — mapa em duas camadas

### `mapHtml.ts`
- `map.on('moveend', ...)` + emissão inicial → posta
  `{ type:'bounds', bbox:{minLng,minLat,maxLng,maxLat} }`.
- Dois estilos de marcador (mesmo `L.divIcon`):
  - **social** (`nota != null`): pin atual (cor por nota + número).
  - **descoberta** (`nota == null`): ponto neutro (berinjela/cinza, sem
    número, ~24px), com `title`/`alt` do nome.
- Ambos com `.on('click', → post({type:'open-restaurant', cnpj: id}))`.
- Mantém o marcador "você" e o `fitBounds` inicial; após o primeiro
  `bounds`, o fit deixa de forçar (só na carga).

### `MapScreen.tsx` / `usePlaces.ts`
- `MapScreen` lê a mensagem `bounds`, guarda `bbox` com **debounce ~700ms**
  e chama `usePlaces(bbox)`.
- `usePlaces(bbox)` reage a mudança de bbox; **não limpa os pins ao
  carregar** (troca no sucesso) para evitar flicker.
- Bottom sheet “nessa área”: social primeiro (com nota), depois descoberta
  (com categoria/“sem nota”). Vazio só quando realmente não há nada.
- Tap no card/pin → `onOpenRestaurant(id)` (id pode ser `osm:...`).

### `RestaurantScreen.tsx`
- Buscar na API também para ids `osm:`; fallback `osmPlace` só em erro.

## 10. docker-compose local (Nominatim)

Serviço novo no `docker-compose.yml` da raiz:
```yaml
nominatim:
  image: mediagis/nominatim:5.3
  container_name: gastronomic_nominatim
  environment:
    PBF_URL: ${NOMINATIM_PBF_URL:-https://download.geofabrik.de/south-america/brazil/sudeste-latest.osm.pbf}
    REPLICATION_URL: ${NOMINATIM_REPLICATION_URL:-https://download.geofabrik.de/south-america/brazil/sudeste-updates/}
    IMPORT_STYLE: full
    THREADS: 4
  ports:
    - "8080:8080"
  volumes:
    - nominatim_data:/var/lib/postgresql/16/main
    - nominatim_flatnode:/nominatim/flatnode
  shm_size: 1gb
  restart: unless-stopped
```
- `.env` local: `OSM_BASE_URL=http://nominatim:8080`.
- 1ª subida importa o extract (minutos); documentar `docker compose logs -f nominatim`.
- Produção continua apontando `OSM_BASE_URL` para o Nominatim do Railway.

## 11. Variáveis de ambiente (API)

```
OVERPASS_URL=https://overpass-api.de/api/interpreter
OVERPASS_AMENITIES=restaurant|cafe|bar
OVERPASS_SEARCH_TIMEOUT_MS=8000
OVERPASS_CACHE_TTL_S=86400
OVERPASS_NEGATIVE_CACHE_TTL_S=600
OVERPASS_MIN_INTERVAL_MS=1000
OVERPASS_MAX_WAIT_MS=1200
OVERPASS_MAX_BBOX_SPAN_DEG=0.25
NOMINATIM_PBF_URL=...            # só no compose local
NOMINATIM_REPLICATION_URL=...    # só no compose local
```
Nada de `OSM_API_KEY`.

## 12. Erros e degradação

- Overpass 429/timeout/5xx → serve Postgres; **cache negativo curto**
  (`OVERPASS_NEGATIVE_CACHE_TTL_S`) para não bater em loop.
- Bbox grande → `400`; o app só chama quando o zoom/área permitir.
- Rate-limit esgotado → pula Overpass nesta requisição (serve Postgres).
- App: resposta vazia/erro mantém os pins atuais.
- Atribuição OSM/Overpass permanece visível no mapa.

## 13. Testes

**API**
- `OverpassClient.spec.ts`: parse de node e de way/relation (`center`),
  ignora sem `name`/coord, dedupe por id.
- `PlaceDiscoveryService.spec.ts`: cache hit (não chama Overpass),
  cache miss (chama + upsert em lote), rate-limit sem slot (pula),
  falha do Overpass não propaga.
- `PlaceMapService.spec.ts`: lista inclui `nota: null` (descoberta) e
  `nota` numérica (social); respeita limite.
- `PlaceController` (spec existente/novo): bbox inválida e bbox grande.
- `RestaurantController`: rota `:id` resolve o parâmetro (regressão do fix).

**App**
- `mapHtml.test.ts`: 2 estilos de marcador; mensagem `bounds` emitida;
  clique em descoberta posta `open-restaurant`.
- `usePlaces.test.ts`: refetch ao mudar bbox; não limpa no loading.
- `RestaurantScreen.test.tsx`: id `osm:` busca na API; fallback só em erro.

## 14. Riscos

- **Disponibilidade/limites da Overpass pública** — mitigado por cache
  agressivo (grid + 24h), rate-limit e degradação para Postgres.
- **Import do Nominatim local** — pesado na 1ª vez; documentado.
- **Busca local passa a casar POIs do OSM** (`searchLocal` por
  `nome_fantasia`): resultado pode incluir lugares distantes sem review.
  Aceito no MVP; follow-up: priorizar/filtrar por proximidade.
- **`fitBounds` inicial** com muitos pins de descoberta: limitar pins no
  primeiro render (bbox default + limite).

## 15. Fora de escopo (YAGNI)

Self-host Overpass, providers comerciais/`OSM_API_KEY`, clustering,
filtros por amenity na UI, ordenação por distância, “aberto agora”.
