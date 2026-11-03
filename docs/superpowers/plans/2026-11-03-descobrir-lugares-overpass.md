# Descobrir lugares ao redor (Overpass) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar cafés/bares/restaurantes ao redor no mapa (descoberta via Overpass), persistidos no catálogo, em duas camadas de pins, com Nominatim self-host no compose local.

**Architecture:** O app só fala com a API. `GET /places?bbox=` passa a (1) refrescar a área via Overpass (cache Redis por área + rate-limit + upsert idempotente em `restaurants`) e (2) listar todos os POIs da bbox do Postgres com `nota` (null = descoberta). O app desenha dois estilos de pin pelo `nota` e dispara a busca no `moveend`.

**Tech Stack:** NestJS 12 / TypeORM / Postgres / Redis / ioredis; Expo SDK 58 / RN 0.88 / React 19 / Vitest; Overpass API (pública); Nominatim (self-host, `mediagis/nominatim`).

**Spec:** `docs/superpowers/specs/2026-11-03-descobrir-lugares-overpass-design.md`

## Global Constraints

- API é ESM: imports relativos terminam em `.js` (`./OverpassClient.js`).
- Sem dependências novas em nenhum repo.
- App nunca chama Overpass/Nominatim direto — só a API.
- Overpass/Nominatim atrás da API, com cache + rate-limit em Redis.
- Upsert só toca `source='overpass'`; nunca sobrescreve `source='seed'`.
- Sem migration nova (usa `restaurants` existente).
- Verificação: API `npm test && npm run build`; app `npm run typecheck && npm test`.
- Env novas só na API (ver Task 4).

## Review Focus

- Elemento do Overpass sem `tags.name` ou sem coordenada (node sem `lat/lon`, way sem `center`) deve ser **ignorado**, não quebrar o parser.
- Resposta 200 do Overpass com `remark`/timeout (sem `elements`) deve virar **lista vazia**, não pin inválido.
- Redis indisponível: descoberta deve **degradar** (serve o Postgres), nunca lançar.
- Bbox invertida (`minLng >= maxLng`) ou grande demais → **400**, sem consultar o Overpass.
- Upsert de um POI cujo `id` já é `source='seed'` não deve acontecer (ids distintos); `source='seed'` permanece.

---

### Task 1: OverpassClient

**Files:**
- Create: `api--positive--feed/src/infrastructure/osm/OverpassClient.ts`
- Test: `api--positive--feed/src/infrastructure/osm/OverpassClient.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Bbox = { minLng: number; minLat: number; maxLng: number; maxLat: number };
  export type OverpassConfig = {
    baseUrl: string; userAgent: string; timeoutMs: number; amenities: string;
    cacheTtlS: number; negativeTtlS: number; minIntervalMs: number; maxWaitMs: number;
    gridDeg: number; maxBboxSpanDeg: number;
  };
  export type DiscoveryPlace = {
    id: string; nome: string; categoria: string | null; lat: number; lng: number;
  };
  export class OverpassClient {
    constructor(@Inject('OVERPASS_CONFIG') config: OverpassConfig);
    around(bbox: Bbox): Promise<DiscoveryPlace[]>;
  }
  ```

- [ ] **Step 1: Write the failing test** — `OverpassClient.spec.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { OverpassClient, type OverpassConfig } from './OverpassClient.js';

const config: OverpassConfig = {
  baseUrl: 'https://overpass.test/api/interpreter',
  userAgent: 'tim-test/1.0',
  timeoutMs: 8000,
  amenities: 'restaurant|cafe|bar',
  cacheTtlS: 86400, negativeTtlS: 600, minIntervalMs: 1000, maxWaitMs: 1200,
  gridDeg: 0.005, maxBboxSpanDeg: 0.25,
};
const bbox = { minLng: -46.7, minLat: -23.6, maxLng: -46.6, maxLat: -23.5 };
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;
const el = (o: Record<string, unknown>) => o;

afterEach(() => vi.unstubAllGlobals());

describe('OverpassClient.around', () => {
  it('consulta a bbox, mapeia node e way(center) e usa o User-Agent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({
      elements: [
        el({ type: 'node', id: 1, lat: -23.55, lon: -46.63, tags: { amenity: 'restaurant', name: 'Pizza X' } }),
        el({ type: 'way', id: 2, center: { lat: -23.56, lon: -46.64 }, tags: { amenity: 'cafe', name: 'Café Y' } }),
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await new OverpassClient(config).around(bbox);

    const init = fetchMock.mock.calls[0][1] as { headers: Record<string,string>; body: string };
    expect(init.headers['User-Agent']).toBe('tim-test/1.0');
    expect(decodeURIComponent(init.body)).toContain('-23.6,-46.7,-23.5,-46.6');
    expect(decodeURIComponent(init.body)).toContain('restaurant|cafe|bar');
    expect(out).toEqual([
      { id: 'osm:node/1', nome: 'Pizza X', categoria: 'restaurant', lat: -23.55, lng: -46.63 },
      { id: 'osm:way/2', nome: 'Café Y', categoria: 'cafe', lat: -23.56, lng: -46.64 },
    ]);
  });

  it('ignora elemento sem name ou sem coordenada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({
      elements: [
        el({ type: 'node', id: 1, lat: -23.5, lon: -46.6, tags: { amenity: 'bar' } }),          // sem name
        el({ type: 'way', id: 2, tags: { amenity: 'cafe', name: 'Sem centro' } }),              // sem center
        el({ type: 'node', id: 3, lat: -23.5, lon: -46.6, tags: { name: 'Ok' } }),              // válido
      ],
    })));
    const out = await new OverpassClient(config).around(bbox);
    expect(out.map((p) => p.id)).toEqual(['osm:node/3']);
  });

  it('resposta 200 só com remark devolve vazio', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ remark: 'runtime error: Query timed out' })));
    await expect(new OverpassClient(config).around(bbox)).resolves.toEqual([]);
  });

  it('resposta não-ok lança (o serviço decide o fallback)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) } as Response));
    await expect(new OverpassClient(config).around(bbox)).rejects.toThrow('Overpass failed: 429');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api--positive--feed && npx vitest run src/infrastructure/osm/OverpassClient.spec.ts`
Expected: FAIL — módulo `./OverpassClient.js` não existe.

- [ ] **Step 3: Implement `OverpassClient`**

`around(bbox)`: monta a query
```
[out:json][timeout:{floor(timeoutMs/1000)}];
nwr["amenity"~"^({amenities})$"]({minLat},{minLng},{maxLat},{maxLng});
out center;
```
faz `fetch(baseUrl, { method: 'POST', headers: { 'User-Agent', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(query), signal: AbortSignal.timeout(timeoutMs) })`; se `!res.ok` lança `Overpass failed: {status}`; lê `{ elements }`; para cada elemento: `lat/lng` de `element.lat/lon` (node) ou `element.center.lat/lng` (way/relation); `nome = tags.name?.trim()`; **pula** se `!nome` ou coords não finitas; `id = osm:${type}/${id}`; `categoria = tags.amenity ?? null`; dedupe por `id`. `elements` ausente/não-array → `[]`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api--positive--feed && npx vitest run src/infrastructure/osm/OverpassClient.spec.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
cd api--positive--feed
git add src/infrastructure/osm/OverpassClient.ts src/infrastructure/osm/OverpassClient.spec.ts
git commit -m "feat: OverpassClient (descobrir POIs por bbox)"
```

---

### Task 2: PlaceMapService.list — incluir a descoberta

**Files:**
- Modify: `api--positive--feed/src/application/service/PlaceMapService.ts`
- Test: `api--positive--feed/src/application/service/PlaceMapService.spec.ts`

**Interfaces:**
- Consumes: nada novo.
- Produces:
  ```ts
  export type PlacePin = {
    id: string; nome: string; lat: number; lng: number;
    nota: number | null; bairro: string | null; source: string;
  };
  // list(bbox, limit): inclui TODOS os restaurants com lat/lng na bbox;
  // nota = média das reviews (0-10) ou null.
  ```

- [ ] **Step 1: Write the failing test** — atualizar `PlaceMapService.spec.ts`:

```ts
it('inclui POIs sem review com nota null e expõe source', async () => {
  const restaurants = { find: vi.fn().mockResolvedValue([
    { id: '1', nomeFantasia: 'Pizza X', municipio: 'SP', lat: -23.55, lng: -46.63, source: 'seed' },
    { id: 'osm:node/2', nomeFantasia: 'Café Y', municipio: null, lat: -23.56, lng: -46.64, source: 'overpass' },
    { id: '3', nomeFantasia: 'Sem coord', municipio: 'SP', lat: null, lng: null, source: 'seed' },
  ]) };
  const reviews = { find: vi.fn().mockResolvedValue([{ restaurantId: '1', rating: 4.5 }, { restaurantId: '1', rating: 4 }]) };
  const service = new PlaceMapService(restaurants as never, reviews as never);

  const out = await service.list({ minLng: -46.7, minLat: -23.6, maxLng: -46.6, maxLat: -23.5 }, 200);

  expect(out).toEqual([
    { id: '1', nome: 'Pizza X', lat: -23.55, lng: -46.63, nota: 8.5, bairro: 'SP', source: 'seed' },
    { id: 'osm:node/2', nome: 'Café Y', lat: -23.56, lng: -46.64, nota: null, bairro: null, source: 'overpass' },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api--positive--feed && npx vitest run src/application/service/PlaceMapService.spec.ts`
Expected: FAIL — o caso "Sem coord"/`source`/`nota: null` não bate (hoje filtra `byId.has`).

- [ ] **Step 3: Implement** — trocar o filtro `byId.has(row.id)` por: manter linhas com `lat/lng` não nulos; `nota = byId.has(id) ? média*2 : null`; adicionar `source: row.source`; `order: { id: 'ASC' }` na query; manter o early-return quando `rows.length === 0`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api--positive--feed && npx vitest run src/application/service/PlaceMapService.spec.ts`
Expected: PASS (o teste antigo "só com review" precisa ser ajustado para o novo contrato — atualize a asserção dele).

- [ ] **Step 5: Commit**

```bash
cd api--positive--feed
git add src/application/service/PlaceMapService.ts src/application/service/PlaceMapService.spec.ts
git commit -m "feat: /places inclui descoberta (nota null) e source"
```

---

### Task 3: PlaceDiscoveryService

**Files:**
- Create: `api--positive--feed/src/application/service/PlaceDiscoveryService.ts`
- Test: `api--positive--feed/src/application/service/PlaceDiscoveryService.spec.ts`

**Interfaces:**
- Consumes: `OverpassClient.around`, `Bbox`, `OverpassConfig` (Task 1); `Restaurant` repo; `REDIS_CLIENT`.
- Produces:
  ```ts
  export function snapBbox(bbox: Bbox, gridDeg: number): Bbox; // floor min / ceil max
  export class PlaceDiscoveryService {
    constructor(
      restaurants: Repository<Restaurant>,
      osm: OverpassClient,
      @Inject('REDIS_CLIENT') redis: Redis,
      @Inject('OVERPASS_CONFIG') config: OverpassConfig,
    );
    refreshArea(bbox: Bbox): Promise<void>;
  }
  ```

- [ ] **Step 1: Write the failing test** — `PlaceDiscoveryService.spec.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { PlaceDiscoveryService, snapBbox } from './PlaceDiscoveryService.js';

const cfg = {
  baseUrl: 'x', userAgent: 'ua', timeoutMs: 8000, amenities: 'restaurant|cafe|bar',
  cacheTtlS: 86400, negativeTtlS: 600, minIntervalMs: 1000, maxWaitMs: 1200,
  gridDeg: 0.005, maxBboxSpanDeg: 0.25,
};
const bbox = { minLng: -46.701, minLat: -23.602, maxLng: -46.651, maxLat: -23.552 };

function make(opts: { cached?: string | null; slot?: string | null; places?: unknown[]; around?: Error; maxWaitMs?: number } = {}) {
  const upsert = vi.fn().mockResolvedValue(undefined);
  const restaurants = { upsert } as never;
  const get = vi.fn().mockResolvedValue(opts.cached ?? null);
  // mesmo `set` serve cache (args[2]='EX') e rate-limit (args[4]='NX')
  const set = vi.fn().mockImplementation(async (...args: unknown[]) =>
    args[4] === 'NX' ? (opts.slot === undefined ? 'OK' : opts.slot) : 'OK',
  );
  const redis = { get, set } as never;
  const around = vi.fn();
  if (opts.around) around.mockRejectedValue(opts.around);
  else around.mockResolvedValue(opts.places ?? []);
  const service = new PlaceDiscoveryService(restaurants, { around } as never, redis, {
    ...cfg,
    maxWaitMs: opts.maxWaitMs ?? cfg.maxWaitMs,
  });
  return { service, upsert, get, set, around };
}

describe('snapBbox', () => {
  it('expande min para baixo e max para cima na grade', () => {
    expect(snapBbox(bbox, 0.005)).toEqual({ minLng: -46.705, minLat: -23.605, maxLng: -46.65, maxLat: -23.55 });
  });
});

describe('PlaceDiscoveryService.refreshArea', () => {
  it('cache hit: não chama Overpass nem upsert', async () => {
    const { service, around, upsert } = make({ cached: '[]' });
    await service.refreshArea(bbox);
    expect(around).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('cache miss: chama Overpass, faz upsert e cacheia com TTL', async () => {
    const places = [{ id: 'osm:node/1', nome: 'Pizza', categoria: 'restaurant', lat: -23.55, lng: -46.63 }];
    const { service, upsert, around, set } = make({ places });
    await service.refreshArea(bbox);
    expect(around).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'osm:node/1', source: 'overpass', osmId: 'osm:node/1' })],
      ['id'],
    );
    expect(set).toHaveBeenCalledWith(expect.stringContaining('osm:overpass:'), expect.any(String), 'EX', 86400);
  });

  it('sem slot de rate-limit: pula o Overpass', async () => {
    const { service, around } = make({ slot: null, maxWaitMs: 0 });
    await service.refreshArea(bbox);
    expect(around).not.toHaveBeenCalled();
  });

  it('Overpass falha: não lança e não faz upsert', async () => {
    const { service, upsert } = make({ around: new Error('429') });
    await expect(service.refreshArea(bbox)).resolves.toBeUndefined();
    expect(upsert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api--positive--feed && npx vitest run src/application/service/PlaceDiscoveryService.spec.ts`
Expected: FAIL — serviço não existe.

- [ ] **Step 3: Implement `PlaceDiscoveryService`**

`refreshArea`: `grid = snapBbox(bbox, gridDeg)`; `key = 'osm:overpass:' + sha1(JSON.stringify(grid))`; `if (await cacheGet(key) !== null) return;` `if (!(await acquireSlot('osm:overpass:ratelimit', minIntervalMs, maxWaitMs))) return;` `try { const places = await this.osm.around(bbox); if (places.length) await this.restaurants.upsert(places.map(p => ({ id: p.id, source: 'overpass', osmId: p.id, nomeFantasia: p.nome, tipo: p.categoria, lat: p.lat, lng: p.lng, geocodedAt: new Date() })), ['id']); await cacheSet(key, places, places.length ? cacheTtlS : negativeTtlS); } catch (e) { console.error('overpass refresh failed:', e); }` — `cacheGet/cacheSet/acquireSlot` no mesmo padrão resiliente do `PlaceService` (catch → degrada).

`snapBbox`: `minLng = Math.floor(minLng/grid)*grid` etc.; `maxLng = Math.ceil(maxLng/grid)*grid`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api--positive--feed && npx vitest run src/application/service/PlaceDiscoveryService.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd api--positive--feed
git add src/application/service/PlaceDiscoveryService.ts src/application/service/PlaceDiscoveryService.spec.ts
git commit -m "feat: PlaceDiscoveryService (cache de área + upsert)"
```

---

### Task 4: Config + providers no módulo

**Files:**
- Modify: `api--positive--feed/src/app.module.ts`
- Modify: `api--positive--feed/.env.example`

**Interfaces:**
- Produces: provider `OVERPASS_CONFIG` (tipo `OverpassConfig`), e `OverpassClient`/`PlaceDiscoveryService` registrados.

- [ ] **Step 1: Implement** — em `app.module.ts`: importar `OverpassClient`, `PlaceDiscoveryService`; adicionar aos `providers`; adicionar o provider `OVERPASS_CONFIG` via `useFactory` (ConfigService) com defaults:

```
baseUrl   = OVERPASS_URL || 'https://overpass-api.de/api/interpreter'
userAgent = OSM_USER_AGENT || 'tim-app/0.1 (contato@tim.app)'
timeoutMs = OVERPASS_SEARCH_TIMEOUT_MS || 8000
amenities = OVERPASS_AMENITIES || 'restaurant|cafe|bar'
cacheTtlS = OVERPASS_CACHE_TTL_S || 86400
negativeTtlS = OVERPASS_NEGATIVE_CACHE_TTL_S || 600
minIntervalMs = OVERPASS_MIN_INTERVAL_MS || 1000
maxWaitMs = OVERPASS_MAX_WAIT_MS || 1200
gridDeg = OVERPASS_GRID_DEG || 0.005
maxBboxSpanDeg = OVERPASS_MAX_BBOX_SPAN_DEG || 0.25
```

- [ ] **Step 2: Documentar as envs** em `.env.example` (bloco Overpass, valores acima).

- [ ] **Step 3: Build para validar DI**

Run: `cd api--positive--feed && npm run build`
Expected: compila sem erro.

- [ ] **Step 4: Commit**

```bash
cd api--positive--feed
git add src/app.module.ts .env.example
git commit -m "feat: config do Overpass e providers de descoberta"
```

---

### Task 5: PlaceController.map — validar área + refresh best-effort

**Files:**
- Modify: `api--positive--feed/src/controller/place.ts`
- Test: `api--positive--feed/src/controller/place.spec.ts`

**Interfaces:**
- Consumes: `PlaceDiscoveryService.refreshArea`, `OVERPASS_CONFIG.maxBboxSpanDeg`.
- Produces: `map(bbox, limit)` chama `refreshArea` (best-effort) e devolve `{ results }`.

- [ ] **Step 1: Write the failing test** — adicionar ao `place.spec.ts`:

```ts
describe('PlaceController (GET /places)', () => {
  function makeMap() {
    const list = vi.fn().mockResolvedValue([{ id: '1' }]);
    const refreshArea = vi.fn().mockResolvedValue(undefined);
    const controller = new PlaceController(
      { search: vi.fn() } as never, { list } as never, { refreshArea } as never,
      { maxBboxSpanDeg: 0.25 } as never,
    );
    return { controller, list, refreshArea };
  }

  it('rejeita bbox inválida', async () => {
    const { controller } = makeMap();
    await expect(controller.map('-46.6,-23.5,-46.7,-23.6')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita área grande demais sem chamar Overpass', async () => {
    const { controller, refreshArea } = makeMap();
    await expect(controller.map('-47,-24,-46,-23')).rejects.toBeInstanceOf(BadRequestException);
    expect(refreshArea).not.toHaveBeenCalled();
  });

  it('refresca a área e lista os pins', async () => {
    const { controller, refreshArea, list } = makeMap();
    const out = await controller.map('-46.7,-23.6,-46.6,-23.5');
    expect(refreshArea).toHaveBeenCalledWith({ minLng: -46.7, minLat: -23.6, maxLng: -46.6, maxLat: -23.5 });
    expect(list).toHaveBeenCalled();
    expect(out).toEqual({ results: [{ id: '1' }] });
  });

  it('Overpass falhou: ainda devolve o Postgres', async () => {
    const { controller, list, refreshArea } = makeMap();
    refreshArea.mockRejectedValue(new Error('boom'));
    await expect(controller.map('-46.7,-23.6,-46.6,-23.5')).resolves.toEqual({ results: [{ id: '1' }] });
    expect(list).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api--positive--feed && npx vitest run src/controller/place.spec.ts`
Expected: FAIL — construtor/assinatura sem `refreshArea`/config.

- [ ] **Step 3: Implement** — adicionar ao construtor `placeDiscoveryService: PlaceDiscoveryService` e `@Inject('OVERPASS_CONFIG') overpassConfig: OverpassConfig`; no `map`: validar bbox; `if (maxLng - minLng > maxBboxSpanDeg || maxLat - minLat > maxBboxSpanDeg) throw new BadRequestException('área grande demais')`; depois `try { await this.placeDiscoveryService.refreshArea(cfg) } catch {}`; `const results = await this.placeMapService.list(cfg, limitNum)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api--positive--feed && npx vitest run src/controller/place.spec.ts && npm test && npm run build`
Expected: PASS; suíte e build verdes.

- [ ] **Step 5: Commit**

```bash
cd api--positive--feed
git add src/controller/place.ts src/controller/place.spec.ts
git commit -m "feat: /places valida área e refresca via Overpass (best-effort)"
```

---

### Task 6: Fix da rota de restaurante por id

**Files:**
- Modify: `api--positive--feed/src/controller/restaurant.ts`
- Test: `api--positive--feed/src/controller/restaurant.e2e.spec.ts` (novo, com `@nestjs/testing` + `supertest`)

**Interfaces:**
- Produces: `GET /restaurants/:id` e `GET /restaurants/:id/reviews` casando o parâmetro `id`.

- [ ] **Step 1: Write the failing test**:

```ts
import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { RestaurantController } from './restaurant.js';
import { RestaurantService } from '../application/service/RestaurantService.js';

describe('RestaurantController rota por id', () => {
  it('resolve :id (inclusive osm: com barra) e repassa ao service', async () => {
    const getProfile = vi.fn().mockResolvedValue({ id: 'osm:node/1' });
    const moduleRef = await Test.createTestingModule({
      controllers: [RestaurantController],
      providers: [{ provide: RestaurantService, useValue: { getProfile, getReviews: vi.fn() } }],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get('/restaurants/osm%3Anode%2F1').expect(200);

    expect(getProfile).toHaveBeenCalledWith('osm:node/1', undefined);
    await app.close();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api--positive-feed && npx vitest run src/controller/restaurant.e2e.spec.ts`
Expected: FAIL — `getProfile` recebe `undefined` (rota `:cnpj` + `@Param('id')`).

- [ ] **Step 3: Implement** — trocar as duas rotas para `:id` e os dois `@Param('id')` permanecem (ou ajuste `:cnpj`/`@Param('cnpj')`, desde que casem). Confirmar que `osm%3Anode%2F1` decodifica para `osm:node/1`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api--positive--feed && npx vitest run src/controller/restaurant.e2e.spec.ts && npm test && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd api--positive--feed
git add src/controller/restaurant.ts src/controller/restaurant.e2e.spec.ts
git commit -m "fix: rota /restaurants/:id resolve o parâmetro (osm: inclusive)"
```

---

### Task 7: App — PlacePin + mapHtml em duas camadas + bounds

**Files:**
- Modify: `app--positive/src/api/place.ts`
- Modify: `app--positive/src/mapMock.ts`
- Modify: `app--positive/src/mapHtml.ts`
- Test: `app--positive/src/mapHtml.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // api/place.ts
  export type PlacePin = {
    id: string; nome: string; lat: number; lng: number;
    nota: number | null; bairro: string | null; source: string;
  };
  // mapMock.ts
  export type MapPlace = { cnpj: string; nome: string; nota: number | null; bairro: string; lat: number; lng: number; cor: string; };
  // mapHtml.ts: buildMapHtml({ places, mode, tileKey }) já existente;
  //   nota == null → pin de descoberta; nota != null → pin social (número).
  //   Emite { type:'bounds', bbox } no moveend e no init.
  ```

- [ ] **Step 1: Write the failing test** — adicionar ao `mapHtml.test.ts`:

```ts
it('nota null vira pin de descoberta (sem número)', () => {
  const discovery = { ...places[0]!, cnpj: 'osm:node/9', nome: 'Café Novo', nota: null };
  const html = buildMapHtml({ places: [discovery], mode: 'light' });
  expect(html).toContain('pin-desc');
  expect(html).toContain('osm:node/9');
  expect(html).not.toContain('class="pin"');
});

it('social mantém o pin com número', () => {
  const social = { ...places[0]!, cnpj: 'seed-1', nota: 9.5 };
  const html = buildMapHtml({ places: [social], mode: 'light' });
  expect(html).toContain('class="pin"');
  expect(html).toContain('9.5');
});

it('emite bounds no moveend', () => {
  const html = buildMapHtml({ places, mode: 'light' });
  expect(html).toContain("on('moveend'");
  expect(html).toContain("'bounds'");
});
```

> Ajuste também o teste existente "um pin por lugar, com cnpj e nota": `nota` agora é `number | null`, então use `p.nota != null ? p.nota.toFixed(1) : ''` (ou filtre os de descoberta).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app--positive && npx vitest run src/mapHtml.test.ts`
Expected: FAIL — não há `pin-desc`/`moveend`/`bounds`; e `nota` ainda é `number`.

- [ ] **Step 3: Implement**
  - `api/place.ts`: `PlacePin` com `nota: number | null` e `source: string`.
  - `mapMock.ts`: `MapPlace.nota: number | null` (ajustar `mapPlaces()` se preciso — segue number).
  - `mapHtml.ts`: no `places.forEach`, se `p.nota == null` cria `L.divIcon` com classe `pin-desc` (bolinha neutra ~24px, sem número, `iconAnchor` central); senão o pin atual (classe `pin`, número). Ambos com `.on('click', → post open-restaurant cnpj: p.cnpj)`. Após `init`, `map.on('moveend', function(){ var b = map.getBounds(); post({ type:'bounds', bbox:{ minLng:b.getWest(), minLat:b.getSouth(), maxLng:b.getEast(), maxLat:b.getNorth() } }); });` e emitir uma vez ao final do `init`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app--positive && npx vitest run src/mapHtml.test.ts`
Expected: PASS (ajustar o teste "um pin por lugar" para lidar com `nota` nullable).

- [ ] **Step 5: Commit**

```bash
cd app--positive
git add src/api/place.ts src/mapMock.ts src/mapHtml.ts src/mapHtml.test.ts
git commit -m "feat: mapa com dois estilos de pin e emissão de bounds"
```

---

### Task 8: App — usePlaces por bbox + MapScreen

**Files:**
- Modify: `app--positive/src/usePlaces.ts`
- Modify: `app--positive/src/MapScreen.tsx`
- Test: `app--positive/src/usePlaces.test.tsx` (novo)

**Interfaces:**
- Consumes: `PlacePin` (Task 7), `MapPlace`.
- Produces: `usePlaces(bbox)` mantém os pins em loading/erro; `MapScreen` guarda o `bbox` do WebView (debounce 700ms) e o repassa.

- [ ] **Step 1: Write the failing test** — `usePlaces.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create } from 'react-test-renderer';
import { createElement } from 'react';
import { usePlaces } from './usePlaces';
import { getPlaces } from './api/place';

vi.mock('./api/place', () => ({ getPlaces: vi.fn() }));
const getPlacesMock = vi.mocked(getPlaces);

function render(bbox: Parameters<typeof usePlaces>[0]) {
  let api: ReturnType<typeof usePlaces>;
  const Probe = () => { api = usePlaces(bbox); return null; };
  act(() => { create(createElement(Probe)); });
  return { get: () => api! };
}

beforeEach(() => getPlacesMock.mockReset());

describe('usePlaces', () => {
  it('carrega os pins da bbox', async () => {
    getPlacesMock.mockResolvedValue([{ id: '1', nome: 'X', lat: 1, lng: 2, nota: null, bairro: null, source: 'overpass' }]);
    const bbox = { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 };
    const h = render(bbox);
    await act(async () => {});
    expect(getPlacesMock).toHaveBeenCalledWith(bbox);
    expect(h.get().pins).toHaveLength(1);
  });

  it('erro mantém os pins atuais', async () => {
    getPlacesMock.mockResolvedValueOnce([{ id: '1', nome: 'X', lat: 1, lng: 2, nota: null, bairro: null, source: 'overpass' }]);
    const bbox = { minLng: 0, minLat: 0, maxLng: 1, maxLat: 1 };
    const h = render(bbox);
    await act(async () => {});
    getPlacesMock.mockRejectedValueOnce(new Error('net'));
    await act(async () => { await h.get().refresh(); });
    expect(h.get().pins).toHaveLength(1);
    expect(h.get().status).toBe('error');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app--positive && npx vitest run src/usePlaces.test.tsx`
Expected: FAIL — hoje o erro limpa os pins (`setPins([])`).

- [ ] **Step 3: Implement**
  - `usePlaces`: no catch, **não** limpar `pins` (só `setStatus('error')`).
  - `MapScreen`: estado `bbox` (default `DEFAULT_BBOX`); no `onMessage`, tratar `data.type === 'bounds'` com bbox válido; debounce ~700ms (um `useEffect`/`setTimeout` com cleanup) antes de setar; `usePlaces(bbox)`; mapear `pin.nota` para `MapPlace.nota` e `cor = pin.nota != null ? pinColor(pin.nota) : palette.berinjela`. Ordenar a lista do rail: social (nota != null) primeiro, depois descoberta.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app--positive && npx vitest run src/usePlaces.test.tsx && npm run typecheck && npm test`
Expected: PASS; typecheck e suíte verdes.

- [ ] **Step 5: Commit**

```bash
cd app--positive
git add src/usePlaces.ts src/MapScreen.tsx src/usePlaces.test.tsx
git commit -m "feat: mapa segue o bbox visível e mantém pins em erro"
```

---

### Task 9: App — abrir restaurante OSM persistido

**Files:**
- Modify: `app--positive/src/RestaurantScreen.tsx`
- Test: `app--positive/src/RestaurantScreen.test.tsx`

**Interfaces:**
- Consumes: `getRestaurant`/`getRestaurantReviews` (via `useRestaurant`).
- Produces: `RestaurantScreen` busca na API também para `cnpj` que começa com `osm:`; usa `osmPlace` só quando a API falha.

- [ ] **Step 1: Write the failing test** — adicionar:

```tsx
it('id osm: busca na API em vez de mostrar "não encontrei"', async () => {
  getRestaurantMock.mockResolvedValue({ id: 'osm:node/1', nome: 'Café Novo', /* ...profile */ });
  const { text } = render({ cnpj: 'osm:node/1' });
  await act(async () => {});
  expect(getRestaurantMock).toHaveBeenCalledWith('osm:node/1', expect.anything());
  expect(text()).toContain('Café Novo');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app--positive && npx vitest run src/RestaurantScreen.test.tsx`
Expected: FAIL — `useRestaurant` está desabilitado (`enabled = !injected && !isOsm`).

- [ ] **Step 3: Implement** — `useRestaurant(cnpj, userId, !injected)` (remover o `!isOsm`); no render, manter o fallback `osmPlace` quando `remote.status === 'error'`; mostrar "não encontrei" só quando não houver `osmPlace` **nem** dados da API.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app--positive && npx vitest run src/RestaurantScreen.test.tsx && npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd app--positive
git add src/RestaurantScreen.tsx src/RestaurantScreen.test.tsx
git commit -m "feat: página do restaurante abre POIs osm: persistidos"
```

---

### Task 10: docker-compose local (Nominatim) + docs

**Files:**
- Modify: `docker-compose.yml` (raiz de `gastro_app`)
- Modify: `api--positive--feed/.env.example` (bloco Nominatim local)

**Interfaces:**
- Produces: serviço `nominatim` no compose; env `NOMINATIM_PBF_URL`/`NOMINATIM_REPLICATION_URL`; `OSM_BASE_URL=http://nominatim:8080` para dev.

- [ ] **Step 1: Implement** — adicionar ao `docker-compose.yml`:

```yaml
  nominatim:
    image: mediagis/nominatim:5.3
    container_name: gastronomic_nominatim
    restart: unless-stopped
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
```

adicionar `nominatim_data:` e `nominatim_flatnode:` em `volumes:`. Documentar no `.env.example`: `OSM_BASE_URL=http://nominatim:8080` e as duas `NOMINATIM_*`.

- [ ] **Step 2: Validar o compose**

Run: `cd /home/king/Documents/personal/gastro_app && docker compose config >/dev/null`
Expected: exit 0 (sem erro de sintaxe). *(Se o daemon docker estiver parado, `docker compose config` ainda valida o YAML.)*

- [ ] **Step 3: Documentar no README** a 1ª subida (`docker compose up -d nominatim`, `docker compose logs -f nominatim`, import demora minutos).

- [ ] **Step 4: Commit**

```bash
cd /home/king/Documents/personal/gastro_app
git add docker-compose.yml api--positive--feed/.env.example
git commit -m "chore: Nominatim self-host no compose local (extract Sudeste/SP)"
```

---

## Self-Review

- **Cobertura da spec:** §6 endpoint → T5; §7 Overpass → T1/T3; §8 persistência → T3; §9 app → T7/T8/T9; §10 compose → T10; §11 env → T4; fixes de integração → T6/T9. Sem lacunas.
- **Tipos:** `Bbox`/`OverpassConfig`/`DiscoveryPlace` (T1) usados em T3/T4/T5; `PlacePin`/`MapPlace` (T7) usados em T8; `refreshArea` (T3) usado em T5. Nomes consistentes.
- **Review Focus no plano:** par parser infeliz → T1; `remark` → T1; Redis off → T3; bbox inválida/grande → T5; `source='seed'` preservado → T3.
- **Proporção:** assinaturas + asserções; corpos só onde o algoritmo não é óbvio (query do Overpass, `snapBbox`, cache/rate-limit).
