import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Avatar } from './Avatar';
import { NoteBadge } from './NoteBadge';
import type { HighlightCard as HL, DiaryEntry } from './mockData';
import { PERFIL } from './mockData';
import { SectionTitle } from './SectionTitle';
import { MOCK_POST_PHOTOS } from './postPhotos';
import { fonts, palette, spacing, useTheme } from './theme';

type Tab = 'diario' | 'listas';
type Versao = 'v1' | 'v2' | 'v3';

// Foto local por índice (assets/posts) para as células/favoritos mock.
function photoAt(index: number): ImageSourcePropType {
  const list = MOCK_POST_PHOTOS;
  return list[((index % list.length) + list.length) % list.length] ?? list[0]!;
}

// Tela de perfil com seletor de versão (como o seletor de usuários do
// feed): v1 = layout simples (bio + stats + favoritos + diário); v2 =
// mock docs/04 (botão seguir + abas diário/listas + listas). Ambas usam
// as fotos reais de assets/posts.
export function ProfileScreen() {
  const t = useTheme();
  const [versao, setVersao] = useState<Versao>('v2');

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
    >
      <View style={s.versaoRow}>
        <VersaoChip
          label="perfil v1"
          active={versao === 'v1'}
          onPress={() => setVersao('v1')}
          testID="perfil-v1"
        />
        <VersaoChip
          label="perfil v2"
          active={versao === 'v2'}
          onPress={() => setVersao('v2')}
          testID="perfil-v2"
        />
        <VersaoChip
          label="perfil v3"
          active={versao === 'v3'}
          onPress={() => setVersao('v3')}
          testID="perfil-v3"
        />
      </View>

      {versao === 'v1' ? <PerfilV1 /> : versao === 'v2' ? <PerfilV2 /> : <PerfilV3 />}
    </ScrollView>
  );
}

// ---- v1: layout simples (sem seguir/abas/listas) ------------------------
function PerfilV1() {
  const t = useTheme();
  return (
    <>
      <View style={s.bioBlock}>
        <Avatar userId={PERFIL.userId} size={72} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.name, { color: t.ink }]}>{PERFIL.nome}</Text>
          <Text style={[s.handle, { color: t.sub }]}>{PERFIL.handle}</Text>
          <Text style={[s.bioV1, { color: t.ink }]}>{PERFIL.bio}</Text>
        </View>
      </View>

      <Stats />

      <SectionTitle>favoritos</SectionTitle>
      <Shelf />

      <SectionTitle>diário</SectionTitle>
      <Diary />
    </>
  );
}

// ---- v2: mock docs/04 (seguir + abas diário/listas) ---------------------
function PerfilV2() {
  const t = useTheme();
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<Tab>('diario');

  return (
    <>
      <View style={s.bioBlock}>
        <Avatar userId={PERFIL.userId} size={72} />
        <View style={s.who}>
          <View style={s.nameRow}>
            <Text style={[s.name, { color: t.ink }]}>{PERFIL.nome}</Text>
            <Pressable
              testID="seguir"
              onPress={() => setFollowing((v) => !v)}
              hitSlop={6}
              style={[
                s.followBtn,
                { borderColor: t.ink, backgroundColor: t.ink },
                following && { backgroundColor: 'transparent', opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: following }}
            >
              <Text
                testID="seguir-label"
                style={[s.followText, { color: following ? t.ink : t.bg }]}
              >
                {following ? 'seguindo' : 'seguir'}
              </Text>
            </Pressable>
          </View>
          <Text style={[s.handle, { color: t.sub }]}>{PERFIL.handle}</Text>
        </View>
      </View>

      <Text style={[s.bio, { color: t.ink }]}>{PERFIL.bio}</Text>

      <Stats />

      <SectionTitle>favoritos</SectionTitle>
      <Shelf />

      <View style={[s.contentTabs, { borderBottomColor: t.line }]}>
        <TabButton
          label="diário"
          active={tab === 'diario'}
          onPress={() => setTab('diario')}
          color={t.sub}
          activeColor={t.ink}
          testID="tab-diario"
        />
        <TabButton
          label={`listas · ${PERFIL.listas.length}`}
          active={tab === 'listas'}
          onPress={() => setTab('listas')}
          color={t.sub}
          activeColor={t.ink}
          testID="tab-listas"
        />
      </View>

      {tab === 'diario' ? <Diary /> : <Lists />}

      <Text style={[s.legend, { color: t.sub }]}>
        Botão de seguir ao lado do nome (toque para alternar seguir/seguindo).
        Abas “diário/listas” separam histórico cronológico de curadoria
        intencional — cada uma com o próprio conteúdo abaixo.
      </Text>
    </>
  );
}

// ---- v3: nicho chip + bento destaques + diário lista (docs/mogli/01) ---
function PerfilV3() {
  const t = useTheme();
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<Tab>('diario');

  return (
    <>
      <View style={s.bioBlock}>
        <Avatar userId={PERFIL.userId} size={60} />
        <View style={s.who}>
          <View style={s.nameRow}>
            <Text style={[s.name, { color: t.ink }]}>{PERFIL.nome}</Text>
            <Pressable
              testID="seguir-v3"
              onPress={() => setFollowing((v) => !v)}
              hitSlop={6}
              style={[
                s.followBtn,
                { borderColor: t.ink, backgroundColor: t.ink },
                following && { backgroundColor: 'transparent', opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: following }}
            >
              <Text style={[s.followText, { color: following ? t.ink : t.bg }]}>
                {following ? 'seguindo' : 'seguir'}
              </Text>
            </Pressable>
          </View>
          <Text style={[s.handle, { color: t.sub }]}>{PERFIL.handle}</Text>
          <View style={s.nicheChip}>
            <Text style={s.nicheEmoji}>🍺</Text>
            <Text style={s.nicheText}>{PERFIL.nicho}</Text>
          </View>
        </View>
      </View>

      <Text style={[s.bio, { color: t.ink }]}>{PERFIL.bio}</Text>

      <Stats />

      <SectionTitle>favoritos</SectionTitle>
      <Shelf />

      <View style={s.hlHead}>
        <Text style={[s.hlHeadText, { color: t.sub }]}>⭐ destaques</Text>
      </View>
      <Bento items={PERFIL.destaques} />

      <View style={[s.contentTabs, { borderBottomColor: t.line }]}>
        <TabButton
          label="diário"
          active={tab === 'diario'}
          onPress={() => setTab('diario')}
          color={t.sub}
          activeColor={t.ink}
          testID="tab-diario-v3"
        />
        <TabButton
          label={`listas · ${PERFIL.listas.length}`}
          active={tab === 'listas'}
          onPress={() => setTab('listas')}
          color={t.sub}
          activeColor={t.ink}
          testID="tab-listas-v3"
        />
      </View>

      {tab === 'diario' ? <DiaryList entries={PERFIL.diarioEntradas} /> : <Lists />}
    </>
  );
}

function Bento({ items }: { items: HL[] }) {
  const [left, ...right] = items;
  if (!left) return null;
  return (
    <View style={[s.bento, { paddingHorizontal: spacing.padrao }]}>
      <BentoCard item={left} style={s.bentoTall} />
      <View style={s.bentoCol}>
        {right.map((item, i) => (
          <BentoCard key={i} item={item} style={s.bentoSmall} />
        ))}
      </View>
    </View>
  );
}

function BentoCard({ item, style }: { item: HL; style: StyleProp<ViewStyle> }) {
  const isPhoto = item.kind === 'photo' && item.photoIndex != null;
  return (
    <View
      style={[s.hlCard, { backgroundColor: item.cor }, style]}
    >
      {isPhoto ? (
        <Image source={photoAt(item.photoIndex!)} style={s.fill} />
      ) : null}
      {isPhoto ? <View style={s.hlOverlay} /> : null}
      <View style={s.hlBody}>
        {item.kind === 'text' ? (
          <Text
            style={[s.hlQuote, { color: palette.berinjela }]}
            numberOfLines={5}
          >
            "{item.quote}"
          </Text>
        ) : (
          <Text
            style={[s.hlQuotePhoto, { color: palette.papel }]}
            numberOfLines={2}
          >
            {item.quote}
          </Text>
        )}
        <View style={s.hlFoot}>
          <Text
            style={[
              s.hlPlace,
              { color: item.kind === 'text' ? palette.berinjela : palette.papel },
            ]}
          >
            {item.place}
          </Text>
          {item.nota ? (
            <Stars nota={item.nota} light={item.kind === 'photo'} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Stars({ nota, light }: { nota: string; light?: boolean }) {
  const n = parseFloat(nota) / 2;
  const full = Math.floor(n);
  const half = n - full >= 0.5;
  const color = light ? 'rgba(255,255,255,0.9)' : palette.berinjela;
  const dimColor = light ? 'rgba(255,255,255,0.28)' : 'rgba(36,26,34,0.25)';
  return (
    <View style={s.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text
          key={i}
          style={{
            fontSize: 11,
            color: i <= full ? color : i === full + 1 && half ? color : dimColor,
            opacity: i === full + 1 && half ? 0.6 : 1,
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

function DiaryList({ entries }: { entries: DiaryEntry[] }) {
  const t = useTheme();
  return (
    <View>
      <Text style={[s.monthLabel, { color: t.sub, borderBottomColor: t.line }]}>
        SET 2026
      </Text>
      {entries.map((e, i) => (
        <View
          key={i}
          style={[s.entry, { borderBottomColor: t.line }]}
          testID={`entry-v3-${i}`}
        >
          <View style={s.dayCol}>
            <Text style={[s.dayNum, { color: t.ink }]}>{e.day}</Text>
            <Text style={[s.dayWk, { color: t.sub }]}>{e.weekday}</Text>
          </View>
          <View style={[s.entryThumb, { backgroundColor: e.cor }]}>
            {e.photoIndex != null ? (
              <Image source={photoAt(e.photoIndex)} style={s.fill} />
            ) : null}
          </View>
          <View style={s.entryBody}>
            <View style={s.entryTop}>
              <Text style={[s.entryNm, { color: t.ink }]} numberOfLines={1}>
                {e.place}
              </Text>
            </View>
            {e.nota ? (
              <View style={s.entryMeta}>
                <Stars nota={e.nota} />
                <Text style={[s.entryMetaText, { color: t.sub }]}>{e.nota}</Text>
              </View>
            ) : null}
            {e.excerpt ? (
              <Text style={[s.entryEx, { color: t.ink }]} numberOfLines={2}>
                {e.excerpt}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// ---- blocos compartilhados ---------------------------------------------
function Stats() {
  const t = useTheme();
  return (
    <View style={[s.stats, { borderBottomColor: t.line }]}>
      {PERFIL.stats.map((st) => (
        <View key={st.l} style={s.stat}>
          <Text style={[s.statN, { color: t.ink }]}>{st.n}</Text>
          <Text style={[s.statL, { color: t.sub }]}>{st.l}</Text>
        </View>
      ))}
    </View>
  );
}

function Shelf() {
  return (
    <View style={s.shelf}>
      {PERFIL.favoritos.map((f, i) => (
        <View
          key={f.nota}
          style={[s.sq, { backgroundColor: f.cor }]}
          testID={f.photoIndex != null ? `favorito-foto-${i}` : undefined}
        >
          {f.photoIndex != null ? (
            <Image source={photoAt(f.photoIndex)} style={s.fill} />
          ) : null}
          <NoteBadge note={f.nota} variant="chip" />
        </View>
      ))}
    </View>
  );
}

function Diary() {
  return (
    <View style={s.diaryGrid}>
      {PERFIL.diario.map((cell, i) =>
        cell.kind === 'quote' ? (
          <View
            key={`q-${i}`}
            style={[s.cellQuote, { backgroundColor: cell.cor }]}
          >
            <View style={s.qmeta}>
              <Text
                style={[s.qPlace, { color: quoteInk(cell.cor) }]}
                numberOfLines={1}
              >
                {cell.place}
              </Text>
              <Text style={[s.qNote, { color: quoteInk(cell.cor) }]}>
                {cell.nota}
              </Text>
            </View>
            <Text
              style={[s.qText, { color: quoteInk(cell.cor) }]}
              numberOfLines={2}
            >
              “{cell.text}”
            </Text>
          </View>
        ) : cell.kind === 'photo' || cell.photoIndex != null ? (
          <View
            key={`p-${i}`}
            testID={`diario-foto-${i}`}
            style={[s.cell, { backgroundColor: cell.cor }]}
          >
            <Image source={photoAt(cell.photoIndex ?? 0)} style={s.fill} />
            <NoteBadge note={cell.nota} variant="chip" />
          </View>
        ) : (
          <View
            key={`n-${i}`}
            style={[s.cell, { backgroundColor: cell.cor }]}
          >
            <NoteBadge note={cell.nota} variant="chip" />
          </View>
        ),
      )}
    </View>
  );
}

function Lists() {
  const t = useTheme();
  return (
    <View style={s.lists}>
      {PERFIL.listas.map((l) => (
        <View key={l.title} style={[s.listCard, { borderBottomColor: t.line }]}>
          <Collage cores={l.cores} />
          <View style={s.listBody}>
            <Text style={[s.listTitle, { color: t.ink }]}>{l.title}</Text>
            <Text style={[s.listMeta, { color: t.sub }]}>{l.meta}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function VersaoChip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[
        s.vchip,
        { backgroundColor: t.quietBg },
        active && { backgroundColor: t.chipActiveBg },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          s.vchipText,
          { color: active ? t.chipActiveInk : t.sub },
          active && s.vchipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TabButton({
  label,
  active,
  onPress,
  color,
  activeColor,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color: string;
  activeColor: string;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={6}
      style={[
        s.ctab,
        { borderBottomColor: 'transparent' },
        active && { borderBottomColor: activeColor },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[s.ctabText, { color: active ? activeColor : color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Colagem 2×2 do card de lista: 1ª cor ocupa a coluna inteira à esquerda.
function Collage({ cores }: { cores: string[] }) {
  return (
    <View style={s.collage}>
      <View style={[s.collageTall, { backgroundColor: cores[0] }]} />
      <View style={s.collageCol}>
        <View style={[s.collageSmall, { backgroundColor: cores[1] }]} />
        <View style={[s.collageSmall, { backgroundColor: cores[2] }]} />
      </View>
    </View>
  );
}

// Texto sobre as cores cheias de marca (mostarda → berinjela, pink → papel).
const INK_ON: Record<string, string> = {
  [palette.mostarda]: palette.berinjela,
  [palette.lambeLambe]: palette.papel,
};
function quoteInk(bg: string): string {
  return INK_ON[bg] ?? palette.papel;
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  versaoRow: {
    flexDirection: 'row',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
  },
  vchip: {
    minHeight: 36,
    paddingHorizontal: spacing.padrao - 2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vchipText: { fontSize: 12.5, fontFamily: fonts.corpo500 },
  vchipTextActive: { fontWeight: '600' },
  bioBlock: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    paddingTop: spacing.secao - 4,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.micro,
  },
  who: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: fonts.display800, fontSize: 18, flexShrink: 1 },
  followBtn: {
    marginLeft: 'auto',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 6,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followText: { fontFamily: fonts.display700, fontSize: 12 },
  handle: { fontSize: 12.5, marginTop: 1 },
  bioV1: { fontSize: 13, marginTop: spacing.interno, lineHeight: 19 },
  bio: {
    fontSize: 13,
    marginTop: spacing.interno,
    lineHeight: 19,
    paddingHorizontal: spacing.padrao,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.padrao,
    marginTop: spacing.interno,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontFamily: fonts.display800, fontSize: 16 },
  statL: { fontSize: 11, marginTop: 1 },
  shelf: {
    flexDirection: 'row',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.micro,
  },
  sq: { flex: 1, aspectRatio: 1, borderRadius: 10, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  contentTabs: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ctab: {
    paddingBottom: spacing.interno + 2,
    borderBottomWidth: 2,
    minHeight: 32,
  },
  ctabText: { fontFamily: fonts.display700, fontSize: 13.5 },
  diaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno + 2,
    paddingBottom: spacing.interno,
  },
  cell: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cellQuote: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
  },
  qmeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.interno,
  },
  qPlace: {
    fontSize: 9.5,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    flexShrink: 1,
  },
  qNote: { fontFamily: fonts.display800, fontSize: 16 },
  qText: { fontFamily: fonts.display700, fontSize: 27, lineHeight: 25 },
  lists: {
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
    paddingBottom: 20,
  },
  listCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  collage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 2,
  },
  collageTall: { flex: 1 },
  collageCol: { flex: 1, gap: 2 },
  collageSmall: { flex: 1 },
  listBody: { flex: 1, minWidth: 0 },
  listTitle: { fontFamily: fonts.display700, fontSize: 14 },
  listMeta: { fontSize: 12, marginTop: 3 },
  legend: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
  },
  // v3 styles
  nicheChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    backgroundColor: palette.mostarda,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  nicheEmoji: { fontSize: 13 },
  nicheText: { fontFamily: fonts.display700, fontSize: 11.5, color: palette.berinjela },
  hlHead: {
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.secao - 8,
    paddingBottom: spacing.interno,
  },
  hlHeadText: { fontFamily: fonts.display700, fontSize: 13 },
  bento: { flexDirection: 'row', gap: 6, marginBottom: spacing.interno },
  bentoTall: { flex: 1, height: 246 },
  bentoCol: { flex: 1, gap: 6 },
  bentoSmall: { flex: 1 },
  hlCard: { borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end' },
  hlOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,14,18,0.45)',
  },
  hlBody: { padding: 10 },
  hlQuote: {
    fontFamily: fonts.display700,
    fontSize: 15,
    lineHeight: 19,
    marginBottom: 'auto',
    flexShrink: 1,
  },
  hlQuotePhoto: {
    fontFamily: fonts.corpo500,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  hlFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  hlPlace: { fontFamily: fonts.display800, fontSize: 13, lineHeight: 15, flex: 1 },
  starsRow: { flexDirection: 'row', gap: 1 },
  monthLabel: {
    fontFamily: fonts.display700,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.interno + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entry: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },
  dayCol: { width: 28, alignItems: 'center', paddingTop: 2 },
  dayNum: { fontFamily: fonts.display800, fontSize: 18, lineHeight: 20 },
  dayWk: { fontSize: 10, marginTop: 2 },
  entryThumb: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0 },
  entryBody: { flex: 1, minWidth: 0 },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryNm: { fontFamily: fonts.display700, fontSize: 14, flex: 1 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  entryMetaText: { fontSize: 11.5 },
  entryEx: { fontSize: 12.5, lineHeight: 17, marginTop: 5 },
});
