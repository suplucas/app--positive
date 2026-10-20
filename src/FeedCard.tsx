import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { ExpandableText } from './ExpandableText';
import { Flair } from './Flair';
import { NoteBadge } from './NoteBadge';
import { formatRelative, getNote, restaurantName } from './format';
import { fonts, spacing, useTheme } from './theme';
import type { Review } from './types';

// Linha do feed: texto-primeiro, avatar à esquerda, nota à direita
// (protótipo app-mobile). `strong` marca flair forte (máx. 1 por tela,
// decidido pelo App). `onPress` (opcional) abre a página do restaurante.
export function FeedCard({
  review,
  strong = false,
  onPress,
  onComments,
}: {
  review: Review;
  strong?: boolean;
  onPress?: () => void;
  // docs/12: abre a thread de comentários (só quando o App passa o
  // callback — ex.: cards da página do restaurante não têm thread).
  onComments?: () => void;
}) {
  const t = useTheme();
  const nome = restaurantName(review.restaurantCnpj);
  const body = (
    <>
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
          <ExpandableText
            id={`card-${review.id}`}
            text={review.comment}
            style={[s.caption, { color: t.ink }]}
            color={t.sub}
          />
        ) : null}
        <View style={s.meta}>
          <Text style={[s.metaText, { color: t.sub }]}>▲ {review.likes}</Text>
          <Text style={[s.metaText, { color: t.sub }]}>
            {formatRelative(review.createdAt)}
          </Text>
          {onComments ? (
            <Pressable
              testID={`comentar-card-${review.id}`}
              onPress={onComments}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="abrir comentários"
            >
              <Text style={[s.metaText, { color: t.sub }]}>💬</Text>
            </Pressable>
          ) : null}
          <Flair strong={strong} />
        </View>
      </View>
      <NoteBadge note={getNote(review.rating)} />
    </>
  );
  const style = [s.row, { borderBottomColor: t.line }];
  return onPress ? (
    <Pressable
      style={({ pressed }) => [...style, pressed && { opacity: 0.85 }]}
      testID={`card-${review.id}`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`avaliações em ${nome ?? 'restaurante'}`}
    >
      {body}
    </Pressable>
  ) : (
    <View style={style} testID={`card-${review.id}`}>
      {body}
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
