import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { formatRelative, getNote, restaurantName } from './format';
import { fonts, palette, spacing } from './theme';
import type { Review } from './types';

// Quote card: avaliação textual em destaque (frase forte, sem foto) —
// fundo de marca, cantos arredondados, mesmo tratamento dos quote cards
// do diário do perfil. `tone` alterna mostarda/lambe-lambe como no mock.
export function FeedQuote({
  review,
  tone = 'mostarda',
}: {
  review: Review;
  tone?: 'mostarda' | 'lambeLambe';
}) {
  const nome = restaurantName(review.restaurantCnpj);
  const bg = tone === 'lambeLambe' ? palette.lambeLambe : palette.mostarda;
  const ink = tone === 'lambeLambe' ? palette.papel : palette.berinjela;
  return (
    <View
      testID={`quote-${review.id}`}
      style={[s.card, { backgroundColor: bg }]}
    >
      <View style={s.top}>
        <Avatar userId={review.userId} size={28} />
        <Text style={[s.uname, { color: ink }]}>{review.userId}</Text>
        <Text style={[s.note, { color: ink }]}>{getNote(review.rating)}</Text>
      </View>
      {review.comment ? (
        <Text style={[s.text, { color: ink }]}>“{review.comment}”</Text>
      ) : null}
      <View style={s.meta}>
        <Text style={[s.place, { color: ink }]} numberOfLines={1}>
          {nome ?? ''}
        </Text>
        <Text style={[s.actions, { color: ink }]}>
          ▲ {review.likes} · {formatRelative(review.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: spacing.padrao,
    marginVertical: spacing.interno + 2,
    borderRadius: 16,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao - 2,
    paddingBottom: spacing.padrao,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  uname: { fontFamily: fonts.display700, fontSize: 13 },
  note: {
    marginLeft: 'auto',
    fontFamily: fonts.display800,
    fontSize: 14,
  },
  text: {
    fontFamily: fonts.display700,
    fontSize: 20,
    lineHeight: 26,
    marginTop: 14,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.interno,
  },
  place: { fontSize: 11.5, fontFamily: fonts.corpo600, fontWeight: '600', flexShrink: 1 },
  actions: { fontSize: 11.5, fontFamily: fonts.corpo600, fontWeight: '600', opacity: 0.85 },
});
