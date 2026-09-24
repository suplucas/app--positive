import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { Flair } from './Flair';
import { NoteBadge } from './NoteBadge';
import { formatRelative, getNote, restaurantName } from './format';
import { fonts, spacing, useTheme } from './theme';
import type { Review } from './types';

// Linha do feed: texto-primeiro, avatar à esquerda, nota à direita
// (protótipo app-mobile). `strong` marca flair forte (máx. 1 por tela,
// decidido pelo App).
export function FeedCard({
  review,
  strong = false,
}: {
  review: Review;
  strong?: boolean;
}) {
  const t = useTheme();
  const nome = restaurantName(review.restaurantCnpj);
  return (
    <View style={[s.row, { borderBottomColor: t.line }]} testID={`card-${review.id}`}>
      <Avatar userId={review.userId} />
      <View style={s.body}>
        <View style={s.top}>
          <Text style={[s.uname, { color: t.ink }]}>{review.userId}</Text>
          {nome ? (
            <Text style={[s.place, { color: t.sub }]}>
              em <Text style={[s.placeName, { color: t.ink }]}>{nome}</Text>
            </Text>
          ) : null}
        </View>
        {review.comment ? (
          <Text style={[s.caption, { color: t.ink }]}>{review.comment}</Text>
        ) : null}
        <View style={s.meta}>
          <Text style={[s.metaText, { color: t.sub }]}>▲ {review.likes}</Text>
          <Text style={[s.metaText, { color: t.sub }]}>
            {formatRelative(review.createdAt)}
          </Text>
          <Flair strong={strong} />
        </View>
      </View>
      <NoteBadge note={getNote(review.rating)} />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
    paddingVertical: spacing.padrao,
    paddingHorizontal: spacing.padrao,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  uname: { fontFamily: fonts.display700, fontSize: 13.5 },
  place: { fontSize: 13 },
  placeName: { fontFamily: fonts.corpo600, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 19, marginTop: spacing.micro },
  meta: {
    flexDirection: 'row',
    gap: spacing.padrao,
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: { fontSize: 11.5 },
});
