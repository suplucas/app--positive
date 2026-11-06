import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fonts, palette, spacing, useTheme, type Theme } from './theme';
import { MAP_PLACES, MAP_PEOPLE, type MapPlace, type MapPerson } from './mockData';

const MAP_COLORS = {
  light: { bg: '#F1E6D3', block: '#E9DCC5', park: '#D9E3C2', water: '#CFE0E4' },
  dark:  { bg: '#1B1719', block: '#231E21', park: '#1F2619', water: '#16222A' },
};

// Blocos do mapa falso (percentuais de left/top/width/height em relação ao container)
const BLOCKS: { x: number; y: number; w: number; h: number; park?: true; water?: true }[] = [
  { x: 5, y: 3,  w: 27, h: 11 }, { x: 37, y: 3,  w: 25, h: 11 }, { x: 67, y: 3,  w: 28, h: 11 },
  { x: 5, y: 17, w: 27, h: 10 }, { x: 37, y: 17, w: 25, h: 10 }, { x: 67, y: 17, w: 28, h: 10 },
  { x: 5, y: 30, w: 27, h: 9  }, { x: 37, y: 30, w: 25, h: 9  }, { x: 67, y: 30, w: 28, h: 9  },
  { x: 10, y: 43, w: 30, h: 12, park: true },
  { x: 45, y: 43, w: 17, h: 12 }, { x: 67, y: 43, w: 28, h: 12 },
  { x: 5,  y: 58, w: 27, h: 11 }, { x: 37, y: 58, w: 31, h: 11 },
  { x: 5,  y: 73, w: 27, h: 11 }, { x: 37, y: 73, w: 31, h: 11 },
  { x: 75, y: 57, w: 30, h: 40, water: true },
];

type WishFilters = { rede: boolean; wish: boolean };

export function SearchScreen() {
  const t = useTheme();
  const mc = t.mode === 'dark' ? MAP_COLORS.dark : MAP_COLORS.light;
  const glass = t.mode === 'dark' ? 'rgba(18,18,18,0.92)' : 'rgba(251,242,228,0.94)';
  const pinOff = t.mode === 'dark' ? 'rgba(242,240,239,0.4)' : 'rgba(36,26,34,0.38)';

  const [selected, setSelected] = useState<number | null>(null);
  const [filters, setFilters] = useState<WishFilters>({ rede: false, wish: false });
  const [prices, setPrices] = useState<Record<number, boolean>>({});
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [stab, setStab] = useState<'lugares' | 'pessoas'>('lugares');
  const [wishOverrides, setWishOverrides] = useState<Record<number, boolean>>({});

  const cardAnim = useRef(new Animated.Value(260)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;

  const selectedPlace = selected != null
    ? MAP_PLACES.find(p => p.id === selected) ?? null
    : null;

  function getWish(p: MapPlace) {
    return wishOverrides[p.id] ?? p.wish;
  }

  function isVisible(p: MapPlace) {
    if (filters.rede && !p.net) return false;
    if (filters.wish && !getWish(p)) return false;
    const anyPrice = Object.values(prices).some(Boolean);
    if (anyPrice && !prices[p.price]) return false;
    return true;
  }

  function openCard(id: number) {
    setSelected(id);
    Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }

  function closeCard() {
    Animated.timing(cardAnim, { toValue: 260, useNativeDriver: true, duration: 220 }).start(
      () => setSelected(null),
    );
  }

  function openSearch() {
    if (selected !== null) closeCard();
    setSearching(true);
    Animated.timing(searchOpacity, { toValue: 1, useNativeDriver: true, duration: 160 }).start();
  }

  function closeSearch() {
    Animated.timing(searchOpacity, { toValue: 0, useNativeDriver: true, duration: 130 }).start(() => {
      setSearching(false);
      setQuery('');
    });
  }

  function toggleWish(id: number) {
    const cur = wishOverrides[id] ?? (MAP_PLACES.find(p => p.id === id)?.wish ?? false);
    setWishOverrides(prev => ({ ...prev, [id]: !cur }));
  }

  // Pinos ordenados: selecionado por último (fica acima dos outros)
  const sortedPlaces = [...MAP_PLACES].sort(a => (a.id === selected ? 1 : -1));

  return (
    <View style={s.root}>
      {/* MAPA */}
      <Pressable
        style={[s.map, { backgroundColor: mc.bg }]}
        onPress={() => { if (selected !== null) closeCard(); }}
      >
        {BLOCKS.map((b, i) => (
          <View
            key={i}
            style={[s.mapEl, {
              left: `${b.x}%`, top: `${b.y}%`,
              width: `${b.w}%`, height: `${b.h}%`,
              backgroundColor: b.park ? mc.park : b.water ? mc.water : mc.block,
              borderRadius: b.park || b.water ? 12 : 6,
            }]}
          />
        ))}
        {/* Usuário */}
        <View style={[s.meRing, { left: '52%', top: '58%' }]} />
        <View style={[s.me,     { left: '52%', top: '58%' }]} />
        {/* Pinos */}
        {sortedPlaces.map(p => (
          <MapPin
            key={p.id}
            place={p}
            visible={isVisible(p)}
            selected={selected === p.id}
            isWish={getWish(p)}
            pinOff={pinOff}
            ink={t.ink}
            onPress={() => openCard(p.id)}
          />
        ))}
        {/* Legenda */}
        {selected === null ? (
          <View style={[s.legend, { backgroundColor: glass, borderColor: t.line }]}>
            {[
              { color: palette.lambeLambe, label: 'sua rede foi' },
              { color: palette.mostarda,   label: 'no seu quero ir' },
              { color: pinOff,             label: 'outros' },
            ].map(item => (
              <View key={item.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: item.color }]} />
                <Text style={[s.legendTxt, { color: t.sub }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>

      {/* TOPO FLUTUANTE */}
      <View style={s.floatingTop} pointerEvents="box-none">
        <Pressable
          style={[s.searchBar, { backgroundColor: glass, borderColor: t.line }]}
          onPress={openSearch}
        >
          <Text style={[s.searchIco, { color: t.sub }]}>⌕</Text>
          <Text style={[s.searchPh, { color: t.sub }]}>Restaurante, prato ou pessoa</Text>
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
          style={s.chipsScroll}
        >
          <FilterChip label="Minha rede" dot={palette.lambeLambe} active={filters.rede} glass={glass} t={t}
            onPress={() => setFilters(f => ({ ...f, rede: !f.rede }))} />
          <FilterChip label="Meu quero ir" dot={palette.mostarda} active={filters.wish} glass={glass} t={t}
            onPress={() => setFilters(f => ({ ...f, wish: !f.wish }))} />
          <View style={[s.chipSep, { backgroundColor: t.line }]} />
          {([1, 2, 3, 4] as const).map(p => (
            <FilterChip key={p} label={'$'.repeat(p)} active={!!prices[p]} glass={glass} t={t}
              onPress={() => setPrices(prev => ({ ...prev, [p]: !prev[p] }))} />
          ))}
        </ScrollView>
      </View>

      {/* RECENTRAR */}
      <Pressable style={[s.recenter, { backgroundColor: glass, borderColor: t.line }]}>
        <Text style={{ color: t.ink, fontSize: 17 }}>◎</Text>
      </Pressable>

      {/* CARTÃO DO PINO */}
      {selectedPlace ? (
        <Animated.View
          style={[s.card, { backgroundColor: t.bg, borderColor: t.line },
            { transform: [{ translateY: cardAnim }] }]}
        >
          <PlaceCard
            place={selectedPlace}
            isWish={getWish(selectedPlace)}
            bgColor={t.bg}
            inkColor={t.ink}
            subColor={t.sub}
            lineColor={t.line}
            onClose={closeCard}
            onWish={() => toggleWish(selectedPlace.id)}
          />
        </Animated.View>
      ) : null}

      {/* OVERLAY DE BUSCA */}
      {searching ? (
        <Animated.View style={[s.searchOverlay, { backgroundColor: t.bg, opacity: searchOpacity }]}>
          <View style={s.sHead}>
            <View style={[s.sInput, { backgroundColor: t.quietBg }]}>
              <Text style={{ opacity: 0.6, color: t.ink, marginRight: 6, fontSize: 15 }}>⌕</Text>
              <TextInput
                autoFocus
                style={[s.sTextField, { color: t.ink }]}
                placeholder="Restaurante, prato ou pessoa"
                placeholderTextColor={t.sub}
                value={query}
                onChangeText={setQuery}
              />
            </View>
            <Pressable onPress={closeSearch} style={s.sCancel}>
              <Text style={[s.sCancelText, { color: t.ink }]}>cancelar</Text>
            </Pressable>
          </View>
          <View style={[s.sTabs, { borderBottomColor: t.line }]}>
            {(['lugares', 'pessoas'] as const).map(tab => (
              <Pressable
                key={tab}
                onPress={() => setStab(tab)}
                style={[s.sTab, stab === tab && { borderBottomColor: t.ink, borderBottomWidth: 2 }]}
              >
                <Text style={[s.sTabText, { color: stab === tab ? t.ink : t.sub }]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <SearchResults
            query={query}
            tab={stab}
            t={t}
            onSelectPlace={id => { closeSearch(); openCard(id); }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ── Pino no mapa ────────────────────────────────────────────────────────────
function MapPin({ place, visible, selected, isWish, pinOff, ink, onPress }: {
  place: MapPlace;
  visible: boolean;
  selected: boolean;
  isWish: boolean;
  pinOff: string;
  ink: string;
  onPress: () => void;
}) {
  if (!visible) return null;
  const hasNet = !!place.net;
  const showDrop = hasNet || isWish;

  return (
    <Pressable
      style={[s.pin, { left: `${place.x}%` as any, top: `${place.y}%` as any }]}
      onPress={onPress}
      accessibilityLabel={place.name}
    >
      {showDrop ? (
        <View style={[
          s.pinDrop,
          isWish && !hasNet ? s.pinDropWish : s.pinDropNet,
          selected && { borderWidth: 2.5, borderColor: ink },
        ]}>
          <View style={[s.pinFace, { backgroundColor: hasNet ? place.net!.people[0] : '#fff' }]} />
          <Text style={[s.pinDropText, { color: isWish && !hasNet ? palette.berinjela : '#fff' }]}>
            {hasNet ? String(place.net!.avg).replace('.', ',') : 'quero ir'}
          </Text>
        </View>
      ) : (
        <View style={[s.pinDot, { backgroundColor: pinOff }]} />
      )}
    </Pressable>
  );
}

// ── Cartão do lugar ─────────────────────────────────────────────────────────
function PlaceCard({ place, isWish, bgColor, inkColor, subColor, lineColor, onClose, onWish }: {
  place: MapPlace;
  isWish: boolean;
  bgColor: string;
  inkColor: string;
  subColor: string;
  lineColor: string;
  onClose: () => void;
  onWish: () => void;
}) {
  function starChar(v: number, i: number) {
    if (v >= i) return '★';
    if (v >= i - 0.5) return '⯪';
    return '☆';
  }

  return (
    <>
      <Pressable style={[s.cardClose, { backgroundColor: lineColor }]} onPress={onClose}>
        <Text style={{ color: inkColor, fontSize: 13 }}>✕</Text>
      </Pressable>
      <View style={s.cardRow}>
        <View style={[s.cardThumb, { backgroundColor: place.color }]} />
        <View style={s.cardInfo}>
          <Text style={[s.cardName, { color: inkColor }]}>{place.name}</Text>
          <Text style={[s.cardMeta, { color: subColor }]}>
            {place.hood} · {place.kind} · {'$'.repeat(place.price)} · 350 m
          </Text>
          {place.net ? (
            <View style={s.cardRate}>
              <Text style={s.cardStars}>
                {[1,2,3,4,5].map(i => starChar(place.net!.avg, i)).join('')}
              </Text>
              <Text style={[s.cardRateText, { color: inkColor }]}>
                <Text style={{ fontFamily: fonts.display800 }}>
                  {String(place.net.avg).replace('.', ',')}
                </Text>{' na sua rede'}
              </Text>
            </View>
          ) : (
            <Text style={[s.cardMeta, { color: subColor, marginTop: 6 }]}>
              ninguém da sua rede foi ainda
            </Text>
          )}
        </View>
      </View>

      {place.net ? (
        <View style={[s.cardSocial, { borderTopColor: lineColor }]}>
          <View style={s.socialDots}>
            {place.net.people.map((c, i) => (
              <View key={i} style={[s.socialDot, {
                backgroundColor: c,
                marginLeft: i === 0 ? 0 : -6,
                borderColor: bgColor,
              }]} />
            ))}
          </View>
          <Text style={[s.socialWho, { color: subColor }]}>{place.net.who}</Text>
        </View>
      ) : place.saved ? (
        <View style={[s.cardSocial, { borderTopColor: lineColor }]}>
          <Text style={[s.socialWho, { color: subColor }]}>{place.saved}</Text>
        </View>
      ) : (
        <View style={[s.noNet, { borderTopColor: lineColor }]}>
          <Text style={[s.noNetText, { color: subColor }]}>
            Seja a primeira da sua rede a registrar.
          </Text>
        </View>
      )}

      <View style={s.cardActions}>
        <Pressable
          style={[s.cardBtn, { borderColor: inkColor },
            isWish && { backgroundColor: palette.mostarda, borderColor: palette.mostarda }]}
          onPress={onWish}
        >
          <Text style={[s.cardBtnText, { color: isWish ? palette.berinjela : inkColor }]}>
            {isWish ? '✓ no quero ir' : '+ quero ir'}
          </Text>
        </Pressable>
        <Pressable style={[s.cardBtnSolid, { backgroundColor: inkColor, borderColor: inkColor }]}>
          <Text style={[s.cardBtnText, { color: bgColor }]}>ver lugar</Text>
        </Pressable>
      </View>
    </>
  );
}

// ── Chip de filtro ──────────────────────────────────────────────────────────
function FilterChip({ label, dot, active, glass, t, onPress }: {
  label: string;
  dot?: string;
  active: boolean;
  glass: string;
  t: Theme;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.filterChip,
        { backgroundColor: active ? t.ink : glass, borderColor: active ? t.ink : t.line }]}
    >
      {dot ? <View style={[s.filterDot, { backgroundColor: dot }]} /> : null}
      <Text style={[s.filterChipText, { color: active ? t.bg : t.ink }]}>{label}</Text>
    </Pressable>
  );
}

// ── Resultados da busca ─────────────────────────────────────────────────────
const RECENTS = ['Cantina do Nonno', 'pastel', '@nina.prova'];

function SearchResults({ query, tab, t, onSelectPlace }: {
  query: string;
  tab: 'lugares' | 'pessoas';
  t: Theme;
  onSelectPlace: (id: number) => void;
}) {
  function norm(s: string) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  const places = MAP_PLACES
    .filter(p => !query || norm(`${p.name} ${p.kind} ${p.hood}`).includes(norm(query)))
    .sort((a, b) => (b.net ? 1 : 0) - (a.net ? 1 : 0));

  const people = MAP_PEOPLE.filter(p =>
    !query || norm(`${p.name} ${p.handle}`).includes(norm(query)),
  );

  if (!query) {
    return (
      <ScrollView style={{ flex: 1 }}>
        <Text style={[s.sSection, { color: t.sub }]}>Buscas recentes</Text>
        {RECENTS.map(r => (
          <View key={r} style={s.sResult}>
            <View style={[s.sIcon, { backgroundColor: t.quietBg, borderRadius: 8 }]}>
              <Text style={{ color: t.sub, fontSize: 14 }}>↺</Text>
            </View>
            <Text style={[s.sResTitle, { color: t.ink }]}>{r}</Text>
          </View>
        ))}
        <Text style={[s.sSection, { color: t.sub }]}>
          {tab === 'lugares' ? 'Salvos por 3+ que você segue' : 'Quem você segue também segue'}
        </Text>
        {tab === 'lugares'
          ? places.slice(0, 2).map(p => <PlaceRow key={p.id} place={p} t={t} onPress={() => onSelectPlace(p.id)} />)
          : MAP_PEOPLE.slice(3, 5).map(p => <PersonRow key={p.handle} person={p} t={t} />)
        }
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      {tab === 'lugares' ? (
        places.length === 0 ? (
          <View style={s.sEmpty}>
            <Text style={[s.sEmptyTitle, { color: t.ink }]}>Nenhum lugar com "{query}"</Text>
            <Text style={[s.sEmptyText, { color: t.sub }]}>
              Confere a grafia ou tenta o nome do bairro.
            </Text>
          </View>
        ) : (
          places.map(p => <PlaceRow key={p.id} place={p} t={t} onPress={() => onSelectPlace(p.id)} />)
        )
      ) : (
        people.length === 0 ? (
          <View style={s.sEmpty}>
            <Text style={[s.sEmptyTitle, { color: t.ink }]}>Ninguém com "{query}"</Text>
            <Text style={[s.sEmptyText, { color: t.sub }]}>Tenta pelo @ da pessoa.</Text>
          </View>
        ) : (
          people.map(p => <PersonRow key={p.handle} person={p} t={t} />)
        )
      )}
    </ScrollView>
  );
}

function PlaceRow({ place, t, onPress }: { place: MapPlace; t: Theme; onPress: () => void }) {
  return (
    <Pressable style={s.sResult} onPress={onPress}>
      <View style={[s.sIcon, { backgroundColor: place.color }]} />
      <View style={s.sBody}>
        <Text style={[s.sResTitle, { color: t.ink }]}>{place.name}</Text>
        <Text style={[s.sResMeta, { color: t.sub }]} numberOfLines={1}>
          {place.kind} · {place.hood} · {'$'.repeat(place.price)}
        </Text>
      </View>
      {place.net ? (
        <View style={s.sTagNet}>
          <Text style={[s.sTagText, { color: palette.lambeLambe }]}>
            ★ {String(place.net.avg).replace('.', ',')} rede
          </Text>
        </View>
      ) : (
        <Text style={[s.sTagText, { color: t.sub }]}>350 m</Text>
      )}
    </Pressable>
  );
}

function PersonRow({ person, t }: { person: MapPerson; t: Theme }) {
  const [following, setFollowing] = useState(person.following);
  return (
    <View style={s.sResult}>
      <View style={[s.sIcon, { backgroundColor: person.color, borderRadius: 22 }]} />
      <View style={s.sBody}>
        <Text style={[s.sResTitle, { color: t.ink }]}>{person.name}</Text>
        <Text style={[s.sResMeta, { color: t.sub }]} numberOfLines={1}>
          @{person.handle} · {person.meta}
        </Text>
      </View>
      <Pressable
        onPress={() => setFollowing(v => !v)}
        style={[s.followBtn,
          { borderColor: t.ink, backgroundColor: following ? 'transparent' : t.ink }]}
      >
        <Text style={[s.followBtnText,
          { color: following ? t.ink : t.bg, opacity: following ? 0.7 : 1 }]}>
          {following ? 'seguindo' : 'seguir'}
        </Text>
      </Pressable>
    </View>
  );
}

// ── Estilos ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  map:  { flex: 1 },
  mapEl: { position: 'absolute' },
  meRing: {
    position: 'absolute',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(62,123,214,0.18)',
    marginLeft: -16, marginTop: -16,
  },
  me: {
    position: 'absolute',
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#3E7BD6',
    borderWidth: 3, borderColor: '#fff',
    marginLeft: -8, marginTop: -8,
  },
  pin: { position: 'absolute', alignItems: 'center', marginLeft: -20, marginTop: -38 },
  pinDrop: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingLeft: 4, paddingRight: 8,
    borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 6, elevation: 4,
  },
  pinDropNet:  { backgroundColor: palette.lambeLambe },
  pinDropWish: { backgroundColor: palette.mostarda },
  pinDropText: { fontFamily: fonts.display800, fontSize: 11 },
  pinFace: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff' },
  pinDot:  { width: 11, height: 11, borderRadius: 5.5, borderWidth: 2, borderColor: '#fff' },
  legend: {
    position: 'absolute', left: 12, bottom: 12,
    borderRadius: 12, borderWidth: 1,
    padding: 7, flexDirection: 'row', gap: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 10.5, fontFamily: fonts.corpo },
  floatingTop: { position: 'absolute', top: 0, left: 0, right: 0, padding: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, padding: 12, paddingHorizontal: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  searchIco: { fontSize: 15 },
  searchPh:  { flex: 1, fontSize: 14, fontFamily: fonts.corpo },
  chipsScroll: { marginTop: 10 },
  chipsRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  filterDot: { width: 9, height: 9, borderRadius: 4.5 },
  filterChipText: { fontFamily: fonts.corpo600, fontSize: 12 },
  chipSep: { width: 1, marginVertical: 4, marginHorizontal: 2 },
  recenter: {
    position: 'absolute', right: 12, bottom: 14,
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  card: {
    position: 'absolute', left: 10, right: 10, bottom: 10,
    borderRadius: 20, borderWidth: 1, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  cardClose: {
    position: 'absolute', right: 10, top: 10,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  cardRow:    { flexDirection: 'row', gap: 12 },
  cardThumb:  { width: 64, height: 64, borderRadius: 12, flexShrink: 0 },
  cardInfo:   { flex: 1, minWidth: 0 },
  cardName:   { fontFamily: fonts.display800, fontSize: 17, lineHeight: 20 },
  cardMeta:   { fontSize: 12, marginTop: 3, fontFamily: fonts.corpo },
  cardRate:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  cardStars:  { color: palette.mostarda, fontSize: 13, letterSpacing: 1 },
  cardRateText: { fontSize: 12, fontFamily: fonts.corpo },
  cardSocial: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  socialDots: { flexDirection: 'row' },
  socialDot:  { width: 18, height: 18, borderRadius: 9, borderWidth: 2, marginLeft: -6 },
  socialWho:  { fontSize: 12, flex: 1, fontFamily: fonts.corpo },
  noNet:      { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  noNetText:  { fontSize: 12, fontFamily: fonts.corpo },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cardBtn: {
    flex: 1, borderWidth: 1.5, borderRadius: 20,
    paddingVertical: 10, alignItems: 'center',
  },
  cardBtnSolid: {
    flex: 1, borderWidth: 1.5, borderRadius: 20,
    paddingVertical: 10, alignItems: 'center',
  },
  cardBtnText: { fontFamily: fonts.display700, fontSize: 13 },
  searchOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 20,
  },
  sHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingTop: 16 },
  sInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12,
  },
  sTextField: { flex: 1, fontFamily: fonts.corpo, fontSize: 15 },
  sCancel:     { padding: 4 },
  sCancelText: { fontFamily: fonts.corpo600, fontSize: 14 },
  sTabs: {
    flexDirection: 'row', gap: 22,
    paddingHorizontal: spacing.padrao, paddingTop: spacing.interno,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sTab: {
    paddingBottom: 10,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  sTabText: { fontFamily: fonts.display700, fontSize: 14 },
  sSection: {
    fontFamily: fonts.display700, fontSize: 12.5,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao, paddingBottom: 6,
  },
  sResult: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.padrao, paddingVertical: 10,
  },
  sIcon:     { width: 44, height: 44, borderRadius: 10, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  sBody:     { flex: 1, minWidth: 0 },
  sResTitle: { fontFamily: fonts.display700, fontSize: 14.5 },
  sResMeta:  { fontSize: 12, marginTop: 2, fontFamily: fonts.corpo },
  sTagNet:   { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(230,62,117,0.12)' },
  sTagText:  { fontSize: 10.5, fontFamily: fonts.corpo600 },
  sEmpty:      { padding: 30, alignItems: 'center' },
  sEmptyTitle: { fontFamily: fonts.display700, fontSize: 15, marginBottom: 4 },
  sEmptyText:  { fontSize: 13, fontFamily: fonts.corpo, textAlign: 'center', lineHeight: 20 },
  followBtn: {
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, flexShrink: 0,
  },
  followBtnText: { fontFamily: fonts.display700, fontSize: 11.5 },
});
