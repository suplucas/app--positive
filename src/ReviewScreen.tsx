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
import { fonts, palette, spacing, useTheme } from './theme';

// ── Dados mock ────────────────────────────────────────────────────────────────
const PLACES_NEARBY = [
  { name: 'Boteco da Ana',       hood: 'Vila Madalena', dist: '80 m',  emoji: '🍺', color: '#F2A93B' },
  { name: 'Sushi Kenzo',         hood: 'Pinheiros',     dist: '350 m', emoji: '🍣', color: '#E63E75' },
  { name: 'Cantina Nonna Rosa',  hood: 'Bela Vista',    dist: '1,2 km',emoji: '🍝', color: '#7A9A3D' },
  { name: 'Padaria Flor do Trigo',hood:'Vila Madalena', dist: '400 m', emoji: '🥐', color: '#F2A93B' },
  { name: 'Taqueria El Patio',   hood: 'Pinheiros',     dist: '900 m', emoji: '🌮', color: '#E63E75' },
  { name: 'Bar do Zé',           hood: 'Lapa',          dist: '3 km',  emoji: '🍢', color: '#241A22' },
];
const TAGS = ['volto sim','não volto','boa pra ir sozinho','bom pra date','bom pra grupo','vale a fila','atendimento top','bom custo-benefício','barulhento','pet friendly'];
const USERS_MOCK = [
  { handle: 'bea_come_tudo', color: '#E63E75' },
  { handle: 'joao.come',     color: '#7A9A3D' },
  { handle: 'paulinha',      color: '#F2A93B' },
  { handle: 'lucas.tim',     color: '#241A22' },
];
const PRICES: [string, string][] = [['$','até R$ 50'],['$$','R$ 50–100'],['$$$','R$ 100–200'],['$$$$','mais de R$ 200']];

type Place = typeof PLACES_NEARBY[number];
type Dish  = { name: string; vote: 'up' | 'down' | null };
type Person = { handle?: string; color?: string; freeName?: string };

export function ReviewScreen({ onCancel, onPosted }: { onCancel: () => void; onPosted: () => void }) {
  const t = useTheme();

  // estado principal
  const [place,    setPlace]    = useState<Place | null>(null);
  const [rating,   setRating]   = useState(0);
  const [photos,   setPhotos]   = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [text,     setText]     = useState('');
  const [tags,     setTags]     = useState<Set<string>>(new Set());
  const [dishes,   setDishes]   = useState<Dish[]>([
    { name: 'bolinho de mandioca', vote: 'up' },
    { name: 'pastel de queijo',    vote: null  },
  ]);
  const [dishInput, setDishInput] = useState('');
  const [people,    setPeople]    = useState<Person[]>([]);
  const [pplInput,  setPplInput]  = useState('');
  const [price,     setPrice]     = useState<string | null>(null);
  const [priv,      setPriv]      = useState(false);
  const [searching, setSearching] = useState(false);
  const [query,     setQuery]     = useState('');

  // animação do picker
  const sheetAnim = useRef(new Animated.Value(900)).current;

  function openSheet() {
    setSearching(true);
    Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 14 }).start();
  }
  function closeSheet() {
    Animated.timing(sheetAnim, { toValue: 900, useNativeDriver: true, duration: 240 }).start(
      () => setSearching(false),
    );
  }
  function pickPlace(p: Place) {
    setPlace(p);
    closeSheet();
  }

  const filtered = PLACES_NEARBY.filter(p =>
    !query || p.name.toLowerCase().includes(query.toLowerCase()),
  );

  function toggleTag(tag: string) {
    setTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }
  function addDish() {
    if (!dishInput.trim()) return;
    setDishes(prev => [...prev, { name: dishInput.trim(), vote: null }]);
    setDishInput('');
  }
  function voteDish(i: number, v: 'up' | 'down') {
    setDishes(prev => prev.map((d, idx) => idx === i ? { ...d, vote: d.vote === v ? null : v } : d));
  }
  function removeDish(i: number) {
    setDishes(prev => prev.filter((_, idx) => idx !== i));
  }

  const suggestions = USERS_MOCK.filter(u =>
    pplInput.replace('@', '') &&
    u.handle.includes(pplInput.replace('@', '').toLowerCase()) &&
    !people.some(p => p.handle === u.handle),
  );
  function addUser(u: typeof USERS_MOCK[number]) {
    setPeople(prev => [...prev, { handle: u.handle, color: u.color }]);
    setPplInput('');
  }
  function addFree() {
    const v = pplInput.trim().replace(/^@/, '');
    if (!v) return;
    const u = USERS_MOCK.find(x => x.handle === v);
    if (u) { addUser(u); return; }
    setPeople(prev => [...prev, { freeName: v }]);
    setPplInput('');
  }
  function removePerson(i: number) {
    setPeople(prev => prev.filter((_, idx) => idx !== i));
  }

  const canPublish = !!place;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {/* Restaurante */}
        <View style={s.sec}>
          <Pressable
            style={[s.restRow, { backgroundColor: t.quietBg }]}
            onPress={openSheet}
          >
            <View style={[s.restIcon, { backgroundColor: place ? place.color + '33' : palette.mostarda + '33' }]}>
              <Text style={{ fontSize: 20 }}>{place ? place.emoji : '🔍'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.restName, { color: place ? t.ink : t.sub }]}>
                {place ? place.name : 'onde você comeu?'}
              </Text>
              <Text style={[s.restSub, { color: t.sub }]}>
                {place ? place.hood : 'busque ou escolha um lugar perto'}
              </Text>
            </View>
            {place ? <Text style={[s.restChange, { color: t.sub }]}>trocar</Text> : null}
          </Pressable>

          {/* Foto */}
          <Pressable
            style={[s.photoBox,
              { borderColor: t.line, backgroundColor: t.quietBg },
              photos > 0 && s.photoBoxHas]}
            onPress={() => setPhotos(p => Math.min(p + 1, 10))}
          >
            {photos === 0 ? (
              <>
                <Text style={{ fontSize: 30 }}>📷</Text>
                <Text style={[s.photoHint, { color: t.sub }]}>adicionar fotos</Text>
              </>
            ) : (
              <>
                <View style={s.photoCount}>
                  <Text style={s.photoCountText}>{photos} foto{photos > 1 ? 's' : ''} · toque pra mais</Text>
                </View>
                {rating > 0 ? <StarOverlay rating={rating} /> : null}
              </>
            )}
          </Pressable>
        </View>

        {/* Nota */}
        <View style={[s.sec, { paddingTop: 0 }]}>
          <Text style={[s.lbl, { color: t.sub }]}>
            sua nota <Text style={{ fontFamily: fonts.corpo }}>{'(opcional)'}</Text>
          </Text>
          <StarRating value={rating} onChange={setRating} />
          <Text style={[s.hint, { color: t.sub }]}>
            {rating > 0 ? 'é assim que a nota vai aparecer na foto' : 'toque na metade da estrela pra dar meia'}
          </Text>
          <Text style={[s.dateRow, { color: t.sub }]}>
            📅 <Text style={[{ color: t.ink, fontFamily: fonts.corpo600 }]}>hoje</Text> · toque pra trocar
          </Text>
        </View>

        {/* Expandir */}
        <Pressable
          style={[s.moreBtn, { borderColor: t.ink }]}
          onPress={() => setShowMore(v => !v)}
        >
          <Text style={[s.moreBtnText, { color: t.ink }]}>quer contar mais?</Text>
          <Text style={[s.moreBtnSub, { color: t.sub }]}>
            {showMore ? 'fechar ▴' : 'texto, etiquetas, pratos, quem foi, gasto ▾'}
          </Text>
        </Pressable>

        {showMore ? (
          <View style={[s.moreBox, { borderTopColor: t.line }]}>
            {/* Como foi */}
            <View style={[s.sec, { borderBottomColor: t.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[s.lbl, { color: t.sub }]}>como foi</Text>
              <TextInput
                style={[s.textarea, { backgroundColor: t.quietBg, color: t.ink }]}
                placeholder="conta como foi a noite. o que valeu, o que não valeu…"
                placeholderTextColor={t.sub}
                multiline
                value={text}
                onChangeText={setText}
              />
            </View>

            {/* Etiquetas */}
            <View style={[s.sec, { borderBottomColor: t.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[s.lbl, { color: t.sub }]}>etiquetas</Text>
              <View style={s.chipsWrap}>
                {TAGS.map(tag => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[s.chip, { borderColor: t.line },
                      tags.has(tag) && { backgroundColor: palette.picles, borderColor: palette.picles }]}
                  >
                    <Text style={[s.chipText, { color: tags.has(tag) ? '#fff' : t.ink }]}>{tag}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Pratos */}
            <View style={[s.sec, { borderBottomColor: t.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[s.lbl, { color: t.sub }]}>pratos</Text>
              {dishes.map((d, i) => (
                <View key={i} style={[s.dishRow, { borderBottomColor: t.line }]}>
                  <Text style={[s.dishName, { color: t.ink }]}>{d.name}</Text>
                  <Pressable onPress={() => voteDish(i, 'up')}
                    style={[s.voteBtn, { borderColor: t.line }, d.vote === 'up' && s.voteBtnOn]}>
                    <Text>❤️</Text>
                  </Pressable>
                  <Pressable onPress={() => voteDish(i, 'down')}
                    style={[s.voteBtn, { borderColor: t.line }, d.vote === 'down' && s.voteBtnOn]}>
                    <Text>👎</Text>
                  </Pressable>
                  <Pressable onPress={() => removeDish(i)} style={s.rmBtn}>
                    <Text style={[s.rmText, { color: t.sub }]}>×</Text>
                  </Pressable>
                </View>
              ))}
              <View style={s.addRow}>
                <TextInput
                  style={[s.addInput, { backgroundColor: t.quietBg, color: t.ink }]}
                  placeholder="nome do prato"
                  placeholderTextColor={t.sub}
                  value={dishInput}
                  onChangeText={setDishInput}
                  onSubmitEditing={addDish}
                  returnKeyType="done"
                />
                <Pressable onPress={addDish} style={[s.addBtn, { backgroundColor: t.ink }]}>
                  <Text style={[s.addBtnText, { color: t.bg }]}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Acompanhantes */}
            <View style={[s.sec, { borderBottomColor: t.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[s.lbl, { color: t.sub }]}>quem foi com você</Text>
              <View style={s.chipsWrap}>
                {people.map((p, i) => (
                  <View key={i} style={[s.personChip, { backgroundColor: t.quietBg }]}>
                    <View style={[s.personAv, { backgroundColor: p.color ?? t.line as string }]}>
                      <Text style={s.personAvText}>
                        {(p.handle ?? p.freeName ?? '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[s.personName, { color: t.ink }]}>
                      {p.handle ? `@${p.handle}` : p.freeName}
                    </Text>
                    {p.handle ? <Text style={[s.personSub, { color: t.sub }]}>· convite</Text> : null}
                    <Pressable onPress={() => removePerson(i)}>
                      <Text style={[s.rmText, { color: t.sub }]}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
              <View style={s.addRow}>
                <TextInput
                  style={[s.addInput, { backgroundColor: t.quietBg, color: t.ink }]}
                  placeholder="@usuário ou nome"
                  placeholderTextColor={t.sub}
                  value={pplInput}
                  onChangeText={setPplInput}
                  onSubmitEditing={addFree}
                  autoCapitalize="none"
                />
                <Pressable onPress={addFree} style={[s.addBtn, { backgroundColor: t.ink }]}>
                  <Text style={[s.addBtnText, { color: t.bg }]}>+</Text>
                </Pressable>
              </View>
              {suggestions.map(u => (
                <Pressable key={u.handle} onPress={() => addUser(u)} style={s.sugRow}>
                  <View style={[s.sugAv, { backgroundColor: u.color }]}>
                    <Text style={s.sugAvText}>{u.handle[0].toUpperCase()}</Text>
                  </View>
                  <Text style={[s.sugHandle, { color: t.ink }]}>@{u.handle}</Text>
                  <Text style={[s.sugMeta, { color: t.sub }]}>· você segue</Text>
                </Pressable>
              ))}
              <Text style={[s.hint, { color: t.sub }]}>
                quem tem conta recebe um convite pra dar a própria nota
              </Text>
            </View>

            {/* Preço */}
            <View style={[s.sec, { borderBottomColor: t.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[s.lbl, { color: t.sub }]}>quanto gastou por pessoa</Text>
              <View style={s.chipsWrap}>
                {PRICES.map(([p, hint]) => (
                  <Pressable
                    key={p}
                    onPress={() => setPrice(prev => prev === p ? null : p)}
                    style={[s.chip, s.chipPrice, { borderColor: t.line },
                      price === p && { backgroundColor: t.ink, borderColor: t.ink }]}
                  >
                    <Text style={[s.chipText, { color: price === p ? t.bg : t.ink }]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
              {price ? (
                <Text style={[s.hint, { color: t.sub }]}>
                  {PRICES.find(([p]) => p === price)?.[1]}
                </Text>
              ) : null}
            </View>

            {/* Privacidade */}
            <View style={s.sec}>
              <View style={s.privRow}>
                <Text style={[{ fontSize: 14, color: t.ink }]}>só pra quem me segue</Text>
                <Pressable
                  onPress={() => setPriv(v => !v)}
                  style={[s.toggle, { backgroundColor: priv ? palette.picles : t.line as string }]}
                >
                  <View style={[s.toggleThumb, { left: priv ? 21 : 3 }]} />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <Text style={[s.note, { color: t.sub }]}>
          protótipo v2 · só restaurante já libera o "publicar" (check-in rápido)
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Botão publicar fixo */}
      <View style={[s.footer, { borderTopColor: t.line, backgroundColor: t.bg }]}>
        <Pressable
          style={[s.pubBtn, !canPublish && s.pubBtnDisabled]}
          disabled={!canPublish}
          onPress={onPosted}
        >
          <Text style={s.pubBtnText}>publicar</Text>
        </Pressable>
      </View>

      {/* Picker de restaurante */}
      {searching ? (
        <Animated.View
          style={[s.sheet, { backgroundColor: t.bg }, { transform: [{ translateY: sheetAnim }] }]}
        >
          <View style={[s.sheetHead, { borderBottomColor: t.line }]}>
            <Pressable onPress={closeSheet} style={s.sheetBack}>
              <Text style={[s.sheetBackText, { color: t.ink }]}>‹</Text>
            </Pressable>
            <Text style={[s.sheetTitle, { color: t.ink }]}>onde você comeu?</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={[s.sheetSearch, { backgroundColor: t.quietBg }]}>
            <Text style={{ color: t.sub }}>🔍</Text>
            <TextInput
              autoFocus
              style={[s.sheetInput, { color: t.ink }]}
              placeholder="nome do restaurante"
              placeholderTextColor={t.sub}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Text style={[s.lbl, { color: t.sub, paddingHorizontal: spacing.padrao, paddingTop: 4 }]}>
            {query ? 'resultados' : 'perto de você agora'}
          </Text>
          <ScrollView>
            {(filtered.length > 0 ? filtered : PLACES_NEARBY).map((p, i) => (
              <Pressable key={i} style={s.resRow} onPress={() => pickPlace(p)}>
                <View style={[s.resIcon, { backgroundColor: p.color + '22' }]}>
                  <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.resName, { color: t.ink }]}>{p.name}</Text>
                  <Text style={[s.resSub, { color: t.sub }]}>{p.hood}</Text>
                </View>
                <Text style={[s.resDist, { color: t.sub }]}>{p.dist}</Text>
              </Pressable>
            ))}
            {filtered.length === 0 ? (
              <Text style={[s.note, { color: t.sub }]}>nada encontrado</Text>
            ) : null}
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}

// ── Estrelas (meia estrela) ──────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useTheme();
  return (
    <View style={s.starsRow}>
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <View key={i} style={s.starWrap}>
            <Text style={[s.starBase, { color: t.line as string }]}>★</Text>
            <View style={[s.starFill, { width: `${fill * 100}%` as any }]}>
              <Text style={[s.starBase, { color: palette.mostarda }]}>★</Text>
            </View>
            <Pressable style={[s.starHalf, { left: 0 }]}  onPress={() => onChange(value === i - 0.5 ? 0 : i - 0.5)} />
            <Pressable style={[s.starHalf, { right: 0 }]} onPress={() => onChange(value === i ? 0 : i)} />
          </View>
        );
      })}
      <Text style={[s.ratingVal, { color: t.ink }]}>
        {value > 0 ? String(value).replace('.', ',') + ' / 5' : 'sem nota'}
      </Text>
    </View>
  );
}

// ── Overlay de estrelas sobre a foto ────────────────────────────────────────
function StarOverlay({ rating }: { rating: number }) {
  return (
    <View style={s.photoOverlayStars}>
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <View key={i} style={{ position: 'relative' }}>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>★</Text>
            <View style={[s.starFill, { width: `${fill * 100}%` as any, position: 'absolute', top: 0, left: 0, overflow: 'hidden' }]}>
              <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.92)' }}>★</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  sec: { padding: spacing.padrao },
  lbl: { fontFamily: fonts.display700, fontSize: 13, marginBottom: 8 },
  hint: { fontSize: 12, marginTop: 6 },
  dateRow: { fontSize: 13, marginTop: 14 },

  restRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  restIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  restName: { fontFamily: fonts.display800, fontSize: 17 },
  restSub:  { fontSize: 12.5, marginTop: 1 },
  restChange: { fontSize: 13 },

  photoBox: {
    marginTop: 12, height: 240, borderRadius: 14,
    borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 6, overflow: 'hidden',
  },
  photoBoxHas: {
    borderWidth: 0, borderStyle: 'solid',
    backgroundColor: '#d48a3c',
  },
  photoHint: { fontSize: 13 },
  photoCount: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  photoCountText: { color: '#fff', fontSize: 11.5 },
  photoOverlayStars: {
    position: 'absolute', left: 0, right: 0, bottom: 12,
    flexDirection: 'row', justifyContent: 'center', gap: 4,
  },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starWrap: { width: 36, height: 36, position: 'relative' },
  starBase: { fontSize: 34, lineHeight: 36, position: 'absolute' },
  starFill: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
  starHalf: { position: 'absolute', top: 0, bottom: 0, width: '50%' },
  ratingVal: { marginLeft: 8, fontFamily: fonts.display700, fontSize: 15, minWidth: 60 },

  moreBtn: {
    marginHorizontal: spacing.padrao,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  moreBtnText: { fontFamily: fonts.display700, fontSize: 15 },
  moreBtnSub:  { fontSize: 12.5, fontFamily: fonts.corpo500 },
  moreBox: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.padrao },

  textarea: {
    borderRadius: 12, padding: 12,
    fontSize: 14.5, lineHeight: 21,
    minHeight: 110, textAlignVertical: 'top',
    fontFamily: fonts.corpo,
  },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontFamily: fonts.corpo },
  chipPrice: { minWidth: 48, alignItems: 'center' },

  dishRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dishName: { flex: 1, fontSize: 14 },
  voteBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    opacity: 0.6,
  },
  voteBtnOn: { opacity: 1, borderWidth: 0 },
  rmBtn: { width: 28, alignItems: 'center' },
  rmText: { fontSize: 16 },

  addRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  addInput: { flex: 1, borderRadius: 12, padding: 10, fontSize: 14, fontFamily: fonts.corpo },
  addBtn: { borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontFamily: fonts.display700, fontSize: 18 },

  personChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 4, paddingLeft: 4, paddingRight: 10,
    borderRadius: 18,
  },
  personAv: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  personAvText: { color: '#fff', fontFamily: fonts.display800, fontSize: 11 },
  personName: { fontSize: 13 },
  personSub:  { fontSize: 11 },

  sugRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  sugAv: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sugAvText: { color: '#fff', fontFamily: fonts.display800, fontSize: 12 },
  sugHandle: { fontSize: 13.5 },
  sugMeta:   { fontSize: 12 },

  privRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { width: 46, height: 28, borderRadius: 14, position: 'relative' },
  toggleThumb: {
    position: 'absolute', top: 3,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2,
  },

  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.padrao,
    paddingBottom: spacing.padrao,
  },
  pubBtn: {
    backgroundColor: palette.lambeLambe,
    borderRadius: 20,
    paddingVertical: 13,
    alignItems: 'center',
  },
  pubBtnDisabled: { opacity: 0.35 },
  pubBtnText: { color: '#fff', fontFamily: fonts.display700, fontSize: 15 },

  note: { fontSize: 11.5, textAlign: 'center', padding: 16, paddingHorizontal: 24 },

  sheet: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10, flexDirection: 'column',
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingHorizontal: spacing.padrao,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sheetBackText: { fontSize: 26, lineHeight: 30 },
  sheetTitle: { fontFamily: fonts.display800, fontSize: 18, flex: 1, textAlign: 'center' },
  sheetSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, borderRadius: 12, paddingHorizontal: 12,
  },
  sheetInput: { flex: 1, paddingVertical: 12, fontSize: 15, fontFamily: fonts.corpo },
  resRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingHorizontal: spacing.padrao },
  resIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resName: { fontFamily: fonts.corpo600, fontSize: 14.5 },
  resSub:  { fontSize: 12, marginTop: 1 },
  resDist: { fontSize: 12 },
});
