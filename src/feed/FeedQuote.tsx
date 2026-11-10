import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ExpandableText } from '../common/ExpandableText';
import { Flair } from './Flair';
import { StarRating } from './StarRating';
import { avatarColor, formatRelative, restaurantName } from '../common/format';
import { fonts, palette, radius, spacing, type } from '../common/theme';
import type { Review } from '../common/types';

export type QuoteTone = 'mostarda' | 'lambeLambe' | 'picles';

const TONE_BG: Record<QuoteTone, string> = {
  mostarda: palette.mostarda,
  lambeLambe: palette.lambeLambe,
  picles: palette.picles,
};
const TONE_INK: Record<QuoteTone, string> = {
  mostarda: palette.berinjela,
  lambeLambe: palette.papel,
  picles: palette.papel,
};

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
  tone?: QuoteTone;
  strong?: boolean;
  onPress?: () => void;
  onComments?: () => void;
  onLike?: () => void;
  onAuthorPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const nome = restaurantName(review.restaurantId);
  const bg = TONE_BG[tone];
  const ink = TONE_INK[tone];
  const avatarBg =
    tone === 'mostarda'
      ? 'rgba(36,26,34,0.25)'
      : 'rgba(255,255,255,0.25)';
  const initial = review.userId.charAt(0).toUpperCase();

  const body = (
    <>
      {/* top row: avatar initial, username, stars */}
      <Pressable
        style={s.top}
        testID={`author-${review.id}`}
        onPress={onAuthorPress}
        disabled={!onAuthorPress}
        hitSlop={6}
        accessibilityRole={onAuthorPress ? 'button' : undefined}
      >
        <View style={[s.avatarCircle, { backgroundColor: avatarBg }]}>
          <Text style={[s.avatarInitial, { color: ink }]}>{initial}</Text>
        </View>
        <Text style={[s.uname, { color: ink }]}>@{review.userId}</Text>
        <View style={s.starWrap}>
          <StarRating rating={review.rating} />
        </View>
      </Pressable>

      {/* quote title / main text */}
      {review.comment ? (
        <ExpandableText
          id={`quote-${review.id}`}
          text={review.comment}
          style={[s.text, { color: ink }]}
          color={ink}
        />
      ) : null}

      {/* meta: restaurant + actions */}
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
              style={s.actionItem}
            >
              <Text style={[s.actionIcon, { color: ink }]}>♡</Text>
              <Text style={[s.actionText, { color: ink }]}>{review.likes}</Text>
            </Pressable>
          ) : (
            <View style={s.actionItem}>
              <Text style={[s.actionIcon, { color: ink }]}>♡</Text>
              <Text style={[s.actionText, { color: ink }]}>{review.likes}</Text>
            </View>
          )}
          {onComments ? (
            <Pressable
              testID={`comentar-quote-${review.id}`}
              onPress={onComments}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="abrir comentários"
            >
              <Text style={[s.actionIcon, { color: ink }]}>💬</Text>
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
              <Text style={[s.actionText, { color: ink }]}>editar</Text>
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
              <Text style={[s.actionText, { color: palette.lambeLambe }]}>
                apagar
              </Text>
            </Pressable>
          ) : null}
          <Text style={[s.time, { color: ink }]}>
            {formatRelative(review.createdAt)}
          </Text>
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
    paddingTop: 14,
    paddingBottom: 14,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontFamily: fonts.display800,
    fontSize: 12,
  },
  uname: {
    fontFamily: fonts.display700,
    fontSize: type.body,
    marginRight: 'auto',
  },
  starWrap: { marginLeft: 'auto' },
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
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 16, opacity: 0.85 },
  actionText: {
    fontSize: 11.5,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    opacity: 0.85,
  },
  time: { fontSize: 11.5, opacity: 0.7 },
});
