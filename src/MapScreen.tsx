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
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { buildMapHtml, buildPinData, jsonForScript } from './mapHtml';
import { pinColor, type MapPlace } from './mapMock';
import { fonts, palette, spacing, useTheme } from './theme';
import { usePlaces, DEFAULT_BBOX, type Bbox } from './usePlaces';

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
}: {
  onOpenRestaurant: (cnpj: string) => void;
}) {
  const t = useTheme();
  const [bbox, setBbox] = useState<Bbox>(DEFAULT_BBOX);
  const [pendingBbox, setPendingBbox] = useState<Bbox | null>(null);
  const { pins, status, refresh } = usePlaces(bbox);

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
        <View
          style={[s.chip, { backgroundColor: t.bg, borderColor: t.line }]}
        >
          <Text style={[s.chipText, { color: t.sub }]}>perto de você</Text>
        </View>
      </View>

      <View
        testID="mapa-sheet"
        style={[
          s.sheet,
          { backgroundColor: t.bg, borderTopColor: t.line },
        ]}
      >
        <View style={[s.handle, { backgroundColor: t.line }]} />
        <View style={s.sheetHead}>
          <Text style={[s.sheetTitle, { color: t.ink }]}>nessa área</Text>
          {status === "error" ? (
            <Pressable
              testID="mapa-retry"
              onPress={() => void refresh()}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={[s.sheetMeta, { color: palette.lambeLambe }]}>
                tentar de novo
              </Text>
            </Pressable>
          ) : (
            <Text style={[s.sheetMeta, { color: t.sub }]}>
              {status === "loading" ? "carregando…" : "posições aproximadas"}
            </Text>
          )}
        </View>

        {places.length === 0 && status === "idle" ? (
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
                      {p.nota != null && p.nota > 0 ? p.nota.toFixed(1) : "—"}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[s.cardName, { color: t.ink }]}
                  numberOfLines={1}
                >
                  {p.nome}
                </Text>
                <Text
                  style={[s.cardMeta, { color: t.sub }]}
                  numberOfLines={1}
                >
                  {p.bairro || "região"}
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
    position: 'absolute',
    top: spacing.interno + 2,
    left: spacing.padrao,
  },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    marginBottom: spacing.interno + 2,
  },
  sheetTitle: { fontFamily: fonts.display700, fontSize: 15 },
  sheetMeta: { fontSize: 10.5 },
  empty: {
    fontSize: 12,
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
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 5,
  },
  cardNote: {
    backgroundColor: 'rgba(36,26,34,0.82)',
    borderRadius: 5,
    paddingHorizontal: 5,
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
    marginTop: 6,
  },
  cardMeta: { fontSize: 11, marginTop: 1 },
});
