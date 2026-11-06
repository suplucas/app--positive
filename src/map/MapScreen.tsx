import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { buildMapHtml, buildPinData, jsonForScript } from './mapHtml';
import { pinColor, type MapPlace } from './mapMock';
import {
  fonts,
  palette,
  radius,
  spacing,
  type,
  useTheme,
} from '../common/theme';
import { layout } from '../common/layout';
import { PageTitle } from '../common/PageTitle';
import { usePlaces, DEFAULT_BBOX, type Bbox } from './usePlaces';
import { searchPlaces } from '../api/place';
import type { PlaceHit } from '../api/types';

// Aba Mapa (docs/16): mapa real OSM/CARTO via WebView + Leaflet,
// full-bleed (sem margem) entre o header e a navbar. O HTML e os pins
// vivem em `mapHtml.ts` (função pura); toque em pin vira postMessage e
// chega aqui em `onMessage`. O bottom sheet "nessa área" flutua sobre o
// mapa e é o caminho acessível (os pins do WebView não são lidos por
// leitores de tela).
type MapMessage = { type?: unknown; cnpj?: unknown; bbox?: unknown };

// Acompanha o mapa: o WebView emite `bounds` a cada `moveend`; a bbox
// só vira requisição depois do usuário parar de arrastar (debounce).
const BBOX_DEBOUNCE_MS = 700;

// O GET /places rejeita bbox com span acima do default da API (0.25°).
// Acima disso, ignoramos o novo enquadramento e mantemos os pins atuais
// (degradação suave em vez de um 400 silencioso). Zooms menores que o
// limite ainda se comportam normalmente.
const MAX_BBOX_SPAN_DEG = 0.25;

function isBbox(value: unknown): value is Bbox {
  if (typeof value !== 'object' || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.minLng === 'number' &&
    Number.isFinite(b.minLng) &&
    typeof b.minLat === 'number' &&
    Number.isFinite(b.minLat) &&
    typeof b.maxLng === 'number' &&
    Number.isFinite(b.maxLng) &&
    typeof b.maxLat === 'number' &&
    Number.isFinite(b.maxLat)
  );
}

function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

// Guarda contra bbox larga demais: a API responde 400 para span > limite.
function isTooLarge(b: Bbox): boolean {
  return (
    b.maxLng - b.minLng > MAX_BBOX_SPAN_DEG ||
    b.maxLat - b.minLat > MAX_BBOX_SPAN_DEG
  );
}

export function MapScreen({
  onOpenRestaurant,
  onBack,
}: {
  onOpenRestaurant: (cnpj: string) => void;
  onBack?: () => void;
}) {
  const t = useTheme();
  const [bbox, setBbox] = useState<Bbox>(DEFAULT_BBOX);
  const [pendingBbox, setPendingBbox] = useState<Bbox | null>(null);
  const { pins, status, refresh } = usePlaces(bbox);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceHit[]>([]);
  const [searchStatus, setSearchStatus] = useState<
    'idle' | 'loading' | 'error'
  >('idle');

  // A fonte do WebView é estável (não embute os lugares): os pins são
  // injetados via `window.setPins`, então uma nova resposta de /places
  // não recarrega o documento nem reseta o viewport do usuário.
  const webRef = useRef<ComponentRef<typeof WebView>>(null);
  // Fit só na carga: o primeiro resultado não-vazio enquadra o mapa;
  // depois disso o enquadramento é do usuário.
  const hasFitRef = useRef(false);
  // O documento do WebView carrega o Leaflet de um CDN; `injectJavaScript`
  // não enfileira, então um fit injetado antes de `window.fitToBounds`
  // existir vira no-op. Só enquadramos depois do `onLoadEnd`.
  const loadedRef = useRef(false);

  // Um drag dispara muitos `bounds`; só o último (após a pausa) vale.
  useEffect(() => {
    if (pendingBbox === null) return;
    const id = setTimeout(() => setBbox(pendingBbox), BBOX_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [pendingBbox]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearchStatus('idle');
      return;
    }
    setSearchStatus('loading');
    try {
      const results = await searchPlaces(q);
      setSearchResults(results);
      setSearchStatus('idle');
    } catch {
      setSearchResults([]);
      setSearchStatus('error');
    }
  };

  const selectResult = (hit: PlaceHit) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchStatus('idle');
    // Se o hit tem coordenadas, centraliza o mapa nele
    if (hit.lat != null && hit.lng != null) {
      setBbox({
        minLng: hit.lng - 0.01,
        minLat: hit.lat - 0.01,
        maxLng: hit.lng + 0.01,
        maxLat: hit.lat + 0.01,
      });
    }
    // Se é resultado OSM (sem CNPJ), usa onOpenPlace... mas MapScreen só
    // tem onOpenRestaurant. Para resultados locais (com CNPJ), abre direto.
    if (hit.source === 'local' && hit.id) {
      onOpenRestaurant(hit.id);
    }
  };

  const places = useMemo<MapPlace[]>(() => {
    const toPlace = (pin: (typeof pins)[number]): MapPlace => ({
      cnpj: pin.id,
      nome: pin.nome,
      nota: pin.nota,
      bairro: pin.bairro ?? '',
      distanciaKm: 0,
      x: 0,
      y: 0,
      lat: pin.lat,
      lng: pin.lng,
      cor: pin.nota == null ? palette.berinjela : pinColor(pin.nota),
    });
    // Rail social-first: quem tem nota (avaliação) vem antes da
    // descoberta (pins neutros sem número).
    return [
      ...pins.filter((p) => p.nota != null).map(toPlace),
      ...pins.filter((p) => p.nota == null).map(toPlace),
    ];
  }, [pins]);

  const tileKey = process.env.EXPO_PUBLIC_MAP_TILES_KEY;
  const html = useMemo(
    () => buildMapHtml({ mode: t.mode, tileKey }),
    [t.mode, tileKey],
  );

  const applyPins = useCallback(
    (fit: boolean) => {
      const list = buildPinData(places);
      const wv = webRef.current;
      if (!wv) return;
      wv.injectJavaScript(
        `window.setPins && window.setPins(${jsonForScript(list)}); true;`,
      );
      if (fit && loadedRef.current && !hasFitRef.current && list.length > 0) {
        hasFitRef.current = true;
        wv.injectJavaScript(
          `window.fitToBounds && window.fitToBounds(${jsonForScript(list)}); true;`,
        );
      }
    },
    [places],
  );

  // Novo documento (tema/tiles): o mapa recarrega, então o fit inicial
  // pode acontecer de novo — mas nunca a cada atualização de `places`.
  useEffect(() => {
    hasFitRef.current = false;
    loadedRef.current = false;
  }, [html]);

  useEffect(() => {
    applyPins(true);
  }, [applyPins, html]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as MapMessage;
        if (data.type === 'open-restaurant' && typeof data.cnpj === 'string') {
          onOpenRestaurant(data.cnpj);
        } else if (data.type === 'bounds' && isBbox(data.bbox)) {
          // Zoom-out grande: mantém a bbox atual (e os pins) em vez de
          // disparar uma requisição que a API rejeitaria.
          if (isTooLarge(data.bbox)) return;
          setPendingBbox(data.bbox);
        }
      } catch {
        // Mensagem de terceiros/HTML inválido: não derruba o mapa.
      }
    },
    [onOpenRestaurant],
  );

  // Links de atribuição (OSM/CARTO) não devem substituir o mapa dentro
  // do WebView; o conteúdo inicial (about:blank/data:) é permitido.
  const shouldLoad = useCallback(
    (request: { url: string }) => !isExternal(request.url),
    [],
  );

  return (
    <View testID="mapa-tela" style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header: título + busca na mesma linha */}
      <View style={[layout.topbar, { justifyContent: 'space-between' }]}>
        <PageTitle>explorar</PageTitle>
        <View style={s.searchWrap}>
          {onBack ? (
            <Pressable
              testID="mapa-busca-voltar"
              onPress={onBack}
              style={layout.backHit}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="voltar"
            >
              <Text style={[layout.backIcon, { color: t.sub }]}>‹</Text>
            </Pressable>
          ) : null}
          <TextInput
            testID="mapa-busca-input"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={(e) => {
              const text = e.nativeEvent.text;
              setSearchQuery(text);
              handleSearch(text);
            }}
            placeholder="buscar restaurante, bairro…"
            placeholderTextColor={t.sub}
            underlineColorAndroid="transparent"
            style={[s.searchInput, { backgroundColor: t.bg, color: t.ink }]}
            accessibilityLabel="buscar restaurante no mapa"
          />
          {searchQuery.trim() !== '' && (
            <Pressable
              testID="mapa-busca-limpar"
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setSearchStatus('idle');
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="limpar busca"
            >
              <Text style={[s.searchClear, { color: t.sub }]}>×</Text>
            </Pressable>
          )}
          {searchStatus === 'loading' ? (
            <Text style={[s.searchLoading, { color: t.sub }]}>buscando…</Text>
          ) : null}
        </View>
      </View>
      {searchStatus === 'error' ? (
        <View style={s.searchErrorWrap}>
          <Text style={[s.searchError, { color: t.sub }]}>
            Não consegui buscar agora. Tente de novo.
          </Text>
        </View>
      ) : null}
      {searchResults.length > 0 && searchQuery.trim() !== '' ? (
        <View style={s.resultsWrap}>
          {searchResults.map((hit) => (
            <Pressable
              key={hit.id}
              testID={`mapa-busca-${hit.id}`}
              onPress={() => selectResult(hit)}
              style={s.resultRow}
              accessibilityRole="button"
              accessibilityLabel={`abrir ${hit.nome}`}
            >
              <Text style={[s.resultName, { color: t.ink }]}>{hit.nome}</Text>
              <Text style={[s.resultMeta, { color: t.sub }]}>
                {[hit.categoria, hit.bairro ?? hit.endereco]
                  .filter(Boolean)
                  .join(' · ') + (hit.source === 'osm' ? ' · osm' : '')}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <WebView
        ref={webRef}
        testID="mapa-webview"
        style={s.map}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        onMessage={onMessage}
        onLoadEnd={() => {
          loadedRef.current = true;
          applyPins(true);
        }}
        onShouldStartLoadWithRequest={shouldLoad}
        accessibilityLabel="mapa de restaurantes por perto"
      />

      <View pointerEvents="none" style={s.chipWrap}>
        <View style={[s.chip, { backgroundColor: t.bg, borderColor: t.line }]}>
          <Text style={[s.chipText, { color: t.sub }]}>perto de você</Text>
        </View>
      </View>

      <View
        testID="mapa-sheet"
        style={[s.sheet, { backgroundColor: t.bg, borderTopColor: t.line }]}
      >
        <View style={[s.handle, { backgroundColor: t.line }]} />
        <View style={s.sheetHead}>
          <Text style={[s.sheetTitle, { color: t.ink }]}>nessa área</Text>
          {status === 'error' ? (
            <View style={s.actions}>
              <Pressable
                testID="mapa-voltar-erro"
                onPress={onBack}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="voltar"
              >
                <Text style={s.sheetMeta}>voltar</Text>
              </Pressable>
              <Pressable
                testID="mapa-retry"
                onPress={() => void refresh()}
                hitSlop={8}
                accessibilityRole="button"
                style={[s.retry, { backgroundColor: palette.lambeLambe }]}
              >
                <Text style={s.sheetMeta}>tentar de novo</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[s.sheetMeta, { color: t.sub }]}>
              {status === 'loading' ? 'carregando…' : 'posições aproximadas'}
            </Text>
          )}
        </View>

        {places.length === 0 && status === 'idle' ? (
          <Text style={[s.empty, { color: t.sub }]}>
            nenhum restaurante com review nesta área.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.rail}
          >
            {places.map((p) => (
              <Pressable
                key={p.cnpj}
                testID={`mapa-card-${p.cnpj}`}
                onPress={() => onOpenRestaurant(p.cnpj)}
                style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel={`abrir ${p.nome}`}
              >
                <View style={[s.cardPhoto, { backgroundColor: p.cor }]}>
                  <View style={s.cardNote}>
                    <Text style={s.cardNoteText}>
                      {p.nota != null && p.nota > 0 ? p.nota.toFixed(1) : '—'}
                    </Text>
                  </View>
                </View>
                <Text style={[s.cardName, { color: t.ink }]} numberOfLines={1}>
                  {p.nome}
                </Text>
                <Text style={[s.cardMeta, { color: t.sub }]} numberOfLines={1}>
                  {p.bairro || 'região'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  // Full-bleed: encosta nas quatro bordas da área entre header/navbar.
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chipWrap: {
    marginRight: spacing.interno,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.medio,
    paddingVertical: spacing.micro,
    shadowColor: palette.berinjela,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipText: {
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    fontSize: 11.5,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.interno,
    paddingBottom: spacing.padrao,
    shadowColor: palette.berinjela,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.interno,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.padrao,
    marginBottom: spacing.medio,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.interno,
    marginTop: spacing.interno,
  },
  sheetTitle: { fontFamily: fonts.display700, fontSize: 15 },
  sheetMeta: { fontSize: 10.5 },
  empty: {
    fontSize: type.small,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.padrao,
  },
  rail: {
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
  },
  card: { width: 150 },
  cardPhoto: {
    width: '100%',
    height: 92,
    borderRadius: radius.card,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: spacing.micro,
  },
  cardNote: {
    backgroundColor: 'rgba(36,26,34,0.82)',
    borderRadius: radius.chip,
    paddingHorizontal: spacing.micro,
    paddingVertical: 1,
  },
  cardNoteText: {
    color: palette.papel,
    fontFamily: fonts.display800,
    fontSize: 10.5,
  },
  cardName: {
    fontFamily: fonts.display700,
    fontSize: 12.5,
    marginTop: spacing.interno,
  },
  cardMeta: { fontSize: type.caption, marginTop: 1 },
  retry: {
    borderRadius: 14,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.medio,
  },
  // Barra de busca ao lado do título no header (seta + input + × em linha).
  searchWrap: {
    flex: 1,
    maxWidth: 260,
    marginLeft: spacing.secao,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.interno,
  },
  searchInput: {
    flex: 1,
    fontSize: type.bodyLarge,
    fontFamily: fonts.corpo,
  },
  searchClear: { fontSize: type.heading },
  searchLoading: { fontSize: type.small },
  searchErrorWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno,
  },
  searchError: { fontSize: type.small },
  resultsWrap: {
    maxHeight: 260,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno,
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.interno,
    paddingVertical: spacing.interno,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultName: {
    fontSize: type.bodyLarge,
    fontFamily: fonts.corpo500,
    flex: 1,
  },
  resultMeta: {
    fontSize: type.small,
  },
});
