import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../common/Avatar';
import { ExpandableText } from '../common/ExpandableText';
import { Flair } from './Flair';
import { formatRelative, getNote, restaurantName } from '../common/format';
import { fonts, palette, radius, spacing, type } from '../common/theme';
import type { Review } from '../common/types';

// Quote card: avaliação textual em destaque (frase forte, sem foto) —
// fundo de marca, cantos arredondados, mesmo tratamento dos quote cards
// do diário do perfil. `tone` alterna mostarda/lambe-lambe como no mock.
// `onPress` (opcional) abre a página do restaurante.
export function FeedQuote({
  review,
  tone = 'mostarda',
  strong = false,
  onPress,
  onComments,
  onLike,
  onAuthorPress,
  onEdit,
  onDelete,
}: {
  review: Review;
  tone?: 'mostarda' | 'lambeLambe';
  // Flair forte (máx. 1 por tela — quem decide é o decorateFeed).
  strong?: boolean;
  onPress?: () => void;
  // docs/12: abre a thread de comentários (opcional, como `onPress`).
  onComments?: () => void;
  onLike?: () => void;
  onAuthorPress?: () => void;
  // Editar/apagar: só o App passa quando a review é do próprio usuário.
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const nome = restaurantName(review.restaurantId);
  const bg = tone === 'lambeLambe' ? palette.lambeLambe : palette.mostarda;
  const ink = tone === 'lambeLambe' ? palette.papel : palette.berinjela;
  const body = (
    <>
      <View style={s.top}>
        <Pressable
          testID={`author-${review.id}`}
          onPress={onAuthorPress}
          disabled={!onAuthorPress}
          hitSlop={6}
          accessibilityRole={onAuthorPress ? 'button' : undefined}
        >
          <Avatar userId={review.userId} size={28} />
        </Pressable>
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
          {review.flairs?.[0] ? (
            <Flair label={review.flairs[0]} strong={strong} />
          ) : null}
          {onLike ? (
            <Pressable
              testID={`like-quote-${review.id}`}
              onPress={onLike}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="curtir avaliação"
            >
              <Text style={[s.actions, { color: ink }]}>▲ {review.likes}</Text>
            </Pressable>
          ) : (
            <Text style={[s.actions, { color: ink }]}>▲ {review.likes}</Text>
          )}
          <Text style={[s.actions, { color: ink }]}>
            {formatRelative(review.createdAt)}
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
          {onEdit ? (
            <Pressable
              testID={`editar-${review.id}`}
              onPress={onEdit}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="editar avaliação"
            >
              <Text style={[s.actions, { color: ink }]}>editar</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              testID={`apagar-${review.id}`}
              onPress={onDelete}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="apagar avaliação"
            >
              <Text style={[s.actions, { color: ink }]}>apagar</Text>
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
    marginVertical: spacing.medio,
    borderRadius: radius.panel,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
    paddingBottom: spacing.padrao,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.interno },
  uname: { fontFamily: fonts.display700, fontSize: type.body },
  note: {
    marginLeft: 'auto',
    fontFamily: fonts.display800,
    fontSize: type.bodyLarge,
  },
  text: {
    fontFamily: fonts.display700,
    fontSize: 20,
    lineHeight: 26,
    marginTop: spacing.padrao,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.interno,
  },
  place: {
    fontSize: 11.5,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    flexShrink: 1,
  },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: {
    fontSize: 11.5,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    opacity: 0.85,
  },
});
