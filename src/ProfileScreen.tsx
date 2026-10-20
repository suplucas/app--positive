import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Avatar } from './Avatar';
import { FeedCard } from './FeedCard';
import { displayName } from './mockData';
import { SavedList } from './SavedList';
import type { SavedRestaurant } from './api/user';
import type { UserProfile } from './api/types';
import { SectionTitle } from './SectionTitle';
import { useProfile } from './useProfile';
import { fonts, palette, spacing, useTheme } from './theme';
import type { Review } from './types';

type Tab = 'queroir' | 'diario';

// Perfil final: bio abaixo do username, stats, quero ir e diário.
export function ProfileScreen({
  onSettings,
  onNotifications,
  savedCnpjs = [],
  savedItems,
  onRemoveSaved,
  onOpenRestaurant,
  onFollowToggle,
  profile,
  reviews,
  userId: propsUserId,
}: {
  onSettings?: () => void;
  // docs/16: notificações saíram da navbar e ganharam atalho (sino) aqui.
  onNotifications?: () => void;
  // Lista "quero ir" (docs/16): o estado vive no App; a aba do perfil
  // (v2) só renderiza. Fonte: `savedCnpjs`/`savedItems`.
  savedCnpjs?: string[];
  savedItems?: SavedRestaurant[];
  onRemoveSaved?: (cnpj: string) => void;
  onOpenRestaurant?: (cnpj: string) => void;
  onFollowToggle?: () => void;
  // Perfil injetado (API/testes); sem ele, busca em /users/:id.
  profile?: UserProfile;
  reviews?: Review[];
  // N5: o perfil reflete o usuário ativo.
  userId?: string;
}) {
  const userId = propsUserId ?? 'bea_come_tudo';
  const t = useTheme();
  const remote = useProfile(userId, !profile);
  const active = profile ?? remote.profile;

  if (!profile && remote.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.sub }}>carregando…</Text>
      </View>
    );
  }

  if (!active) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.ink }}>
          Não consegui carregar o perfil.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
    >
      <View style={s.versaoRow}>
        {onNotifications ? (
          <Pressable
            testID="abrir-notificacoes"
            onPress={onNotifications}
            hitSlop={8}
            style={[s.settingsBtn, { borderColor: t.line }]}
            accessibilityRole="button"
            accessibilityLabel="abrir notificações"
          >
            <Text style={{ fontSize: 14 }}>♡</Text>
          </Pressable>
        ) : null}
        {onSettings ? (
          <Pressable
            testID="configuracoes"
            onPress={onSettings}
            hitSlop={8}
            style={[s.settingsBtn, { borderColor: t.line }]}
            accessibilityRole="button"
            accessibilityLabel="abrir configurações"
          >
            <Text style={{ fontSize: 14 }}>⚙</Text>
          </Pressable>
        ) : null}
      </View>

      <PerfilV2
        userId={userId}
        profile={active}
        reviews={reviews ?? remote.reviews}
        savedCnpjs={savedCnpjs}
        savedItems={savedItems}
        onRemoveSaved={onRemoveSaved}
        onOpenRestaurant={onOpenRestaurant}
        onFollowToggle={onFollowToggle}
      />
    </ScrollView>
  );
}

// ---- perfil final (seguir + abas diário/quero ir/listas) ----------------
function PerfilV2({
  userId,
  profile,
  reviews,
  savedCnpjs = [],
  savedItems,
  onRemoveSaved,
  onOpenRestaurant,
  onFollowToggle,
}: {
  userId: string;
  profile: UserProfile;
  reviews: Review[];
  savedCnpjs?: string[];
  savedItems?: SavedRestaurant[];
  onRemoveSaved?: (cnpj: string) => void;
  onOpenRestaurant?: (cnpj: string) => void;
  onFollowToggle?: () => void;
}) {
  const t = useTheme();
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<Tab>('diario');
  const nome = profile.name || displayName(userId);
  const handle = profile.handle ?? userId;
  const bio = profile.bio ?? '';

  return (
    <>
      <View style={s.bioBlock}>
        <Avatar userId={userId} size={72} />
        <View style={s.who} testID="perfil-identidade">
          <View style={s.nameRow}>
            <Text style={[s.name, { color: t.ink }]}>{nome}</Text>
            {profile.id !== userId ? (
              <Pressable
                testID="seguir"
                onPress={() => {
                  setFollowing((v) => !v);
                  onFollowToggle?.();
                }}
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
            ) : null}
          </View>
          <Text style={[s.handle, { color: t.sub }]}>
            {`@${handle} · São Paulo`}
          </Text>
          <Text style={[s.bio, { color: t.ink }]}>{bio}</Text>
        </View>
      </View>

      <Stats stats={profile.stats} />

      <View style={[s.contentTabs, { borderBottomColor: t.line }]}>
        <TabButton
          label={`quero ir · ${savedCnpjs.length}`}
          active={tab === 'queroir'}
          onPress={() => setTab('queroir')}
          color={t.sub}
          activeColor={t.ink}
          testID="tab-quero-ir"
        />
        <TabButton
          label="diário"
          active={tab === 'diario'}
          onPress={() => setTab('diario')}
          color={t.sub}
          activeColor={t.ink}
          testID="tab-diario"
        />
      </View>

      {tab === 'queroir' ? (
        <SavedList
          cnpjs={savedCnpjs}
          items={savedItems}
          onRemove={onRemoveSaved ?? (() => {})}
          onOpenRestaurant={onOpenRestaurant ?? (() => {})}
        />
      ) : (
        <Diary reviews={reviews} />
      )}

      <Text style={[s.legend, { color: t.sub }]}>
        Botão de seguir ao lado do nome (toque para alternar seguir/seguindo).
        Abas “diário/listas” separam histórico cronológico de curadoria
        intencional — cada uma com o próprio conteúdo abaixo.
      </Text>
    </>
  );
}

// ---- blocos compartilhados ---------------------------------------------
function Stats({
  stats,
}: {
  stats: UserProfile['stats'];
}) {
  const t = useTheme();
  const items = [
    { n: String(stats.reviews), l: 'avaliações' },
    { n: String(stats.followers), l: 'seguidores' },
    { n: String(stats.following), l: 'seguindo' },
    {
      n: stats.notaMedia == null ? '—' : stats.notaMedia.toFixed(1),
      l: 'média',
    },
  ];
  return (
    <View style={[s.stats, { borderBottomColor: t.line }]}>
      {items.map((st) => (
        <View key={st.l} style={s.stat}>
          <Text style={[s.statN, { color: t.ink }]}>{st.n}</Text>
          <Text style={[s.statL, { color: t.sub }]}>{st.l}</Text>
        </View>
      ))}
    </View>
  );
}

function Diary({ reviews }: { reviews: Review[] }) {
  const t = useTheme();
  if (reviews.length === 0) {
    return (
      <Text style={[s.emptyDiary, { color: t.sub }]}>
        sem avaliações ainda.
      </Text>
    );
  }
  return (
    <View style={s.diaryList}>
      {reviews.map((review) => (
        <FeedCard key={String(review.id)} review={review} />
      ))}
    </View>
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

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  versaoRow: {
    flexDirection: 'row',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
  },
  settingsBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
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
  bio: {
    fontSize: 13,
    marginTop: spacing.interno,
    lineHeight: 19,
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
  emptyDiary: {
    fontSize: 13,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.secao,
  },
  diaryList: { paddingTop: spacing.interno },
});
