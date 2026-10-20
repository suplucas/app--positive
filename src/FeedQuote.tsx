import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { ExpandableText } from './ExpandableText';
import { Flair } from './Flair';
import { formatRelative, getNote, restaurantName } from './format';
import { fonts, palette, spacing } from './theme';
import type { Review } from './types';

// Quote card: avaliação textual em destaque (frase forte, sem foto) —
// fundo de marca, cantos arredondados, mesmo tratamento dos quote cards
// do diário do perfil. `tone` alterna mostarda/lambe-lambe como no mock.
// `onPress` (opcional) abre a página do restaurante.
export function FeedQuote({
  review,
  tone = 'mostarda',
  onPress,
  onComments,
}: {
  review: Review;
  tone?: 'mostarda' | 'lambeLambe';
  onPress?: () => void;
  // docs/12: abre a thread de comentários (opcional, como `onPress`).
  onComments?: () => void;
}) {
  const nome = restaurantName(review.restaurantCnpj);
  const bg = tone === 'lambeLambe' ? palette.lambeLambe : palette.mostarda;
  const ink = tone === 'lambeLambe' ? palette.papel : palette.berinjela;
  const body = (
    <>
      <View style={s.top}>
        <Avatar userId={review.userId} size={28} />
        <Text style={[s.uname, { color: ink }]}>{review.userId}</Text>
        <Text style={[s.note, { color: ink }]}>{getNote(review.rating)}</Text>
      </View>
      {review.comment ? (
        <ExpandableText
          id={`quote-${review.id}`}
          text={`“${review.comment}”`}
          style={[s.text, { color: ink }]}
          color={ink}
        />
      ) : null}
      <View style={s.meta}>
        <Text style={[s.place, { color: ink }]} numberOfLines={1}>
          {nome ?? ''}
        </Text>
        <View style={s.metaRight}>
          {review.flairs?.[0] ? <Flair label={review.flairs[0]} /> : null}
          <Text style={[s.actions, { color: ink }]}>
            ▲ {review.likes} · {formatRelative(review.createdAt)}
          </Text>
          {onComments ? (
            <Pressable
              testID={`comentar-quote-${review.id}`}
              onPress={onComments}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="abrir comentários"
            >
              <Text style={[s.actions, { color: ink }]}>💬</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </>
  );
  const style = [s.card, { backgroundColor: bg }];
  return onPress ? (
    <Pressable
      style={({ pressed }) => [...style, pressed && { opacity: 0.85 }]}
      testID={`quote-${review.id}`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`avaliações em ${nome ?? 'restaurante'}`}
    >
      {body}
    </Pressable>
  ) : (
    <View style={style} testID={`quote-${review.id}`}>
      {body}
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
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { fontSize: 11.5, fontFamily: fonts.corpo600, fontWeight: '600', opacity: 0.85 },
});
