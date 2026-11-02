import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Avatar } from './Avatar';
import { FeedCard } from './FeedCard';
import { SectionTitle } from './SectionTitle';
import { fonts, palette, spacing, useTheme } from './theme';
import { useUserProfile } from './useUserProfile';

export function UserProfileScreen({
  userId,
  viewerId,
  onBack,
  onOpenRestaurant,
}: {
  userId: string;
  viewerId?: string;
  onBack: () => void;
  onOpenRestaurant: (restaurantId: string) => void;
}) {
  const t = useTheme();
  const { profile, reviews, status, following, toggleFollow } =
    useUserProfile(userId, viewerId);

  if (status === 'loading') {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <Text style={{ color: t.sub }}>carregando…</Text>
      </View>
    );
  }
  if (!profile) {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <Text style={{ color: t.ink }}>Não consegui carregar o perfil.</Text>
      </View>
    );
  }

  const stats = [
    { n: String(profile.stats.reviews), l: 'avaliações' },
    { n: String(profile.stats.followers), l: 'seguidores' },
    { n: String(profile.stats.following), l: 'seguindo' },
  ];

  return (
    <ScrollView style={{ backgroundColor: t.bg }}>
      <View style={s.topbar}>
        <Pressable
          testID="user-voltar"
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="voltar"
        >
          <Text style={[s.back, { color: t.sub }]}>←</Text>
        </Pressable>
      </View>

      <View style={s.bioBlock}>
        <Avatar userId={userId} size={72} />
        <View style={s.who}>
          <Text style={[s.name, { color: t.ink }]}>{profile.name}</Text>
          <Text style={[s.handle, { color: t.sub }]}>
            {`@${profile.handle ?? userId}`}
          </Text>
          {profile.bio ? (
            <Text style={[s.bio, { color: t.ink }]}>{profile.bio}</Text>
          ) : null}
        </View>
      </View>

      {viewerId && viewerId !== userId ? (
        <Pressable
          testID="user-seguir"
          onPress={() => void toggleFollow()}
          style={[
            s.follow,
            { backgroundColor: following ? 'transparent' : t.ink, borderColor: t.ink },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: following }}
        >
          <Text style={[s.followText, { color: following ? t.ink : t.bg }]}>
            {following ? 'seguindo' : 'seguir'}
          </Text>
        </Pressable>
      ) : null}

      <View style={[s.stats, { borderBottomColor: t.line }]}>
        {stats.map((st) => (
          <View key={st.l} style={s.stat}>
            <Text style={[s.statN, { color: t.ink }]}>{st.n}</Text>
            <Text style={[s.statL, { color: t.sub }]}>{st.l}</Text>
          </View>
        ))}
      </View>

      <SectionTitle>avaliações</SectionTitle>
      {reviews.length === 0 ? (
        <Text style={[s.empty, { color: t.sub }]}>sem avaliações ainda.</Text>
      ) : (
        reviews.map((review) => (
          <FeedCard
            key={String(review.id)}
            review={review}
            onPress={
              review.restaurantId
                ? () => onOpenRestaurant(String(review.restaurantId))
                : undefined
            }
          />
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topbar: { paddingHorizontal: spacing.padrao, paddingTop: spacing.padrao },
  back: { fontSize: 20 },
  bioBlock: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.secao - 4,
  },
  who: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display800, fontSize: 20 },
  handle: { fontSize: 12.5, marginTop: 1 },
  bio: { fontSize: 13, marginTop: spacing.interno, lineHeight: 19 },
  follow: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.padrao,
    marginTop: spacing.padrao,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followText: { fontFamily: fonts.display700, fontSize: 13 },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.padrao,
    marginTop: spacing.padrao,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontFamily: fonts.display800, fontSize: 16 },
  statL: { fontSize: 11, marginTop: 1 },
  empty: {
    fontSize: 13,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
  },
});
