import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ReadMoreText } from '../common/ReadMoreText';
import { StarRating } from './StarRating';
import {
  avatarColor,
  formatRelativeLong,
  restaurantName,
} from '../common/format';
import { fonts, palette, spacing, useTheme } from '../common/theme';
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

// Card de quote do feed v1 (spec 8.3): card colorido (tone do
// decorateFeed) raio 16, avatar translúcido 28, @handle, estrelas na cor
// do ink do card, título grande (`title ?? comment` — fallback D1),
// descrição com ler-mais, ações e tempo. Sem flair e sem borda —
// marginBottom 24 separa os cards.
export function FeedQuote({
  review,
  tone = 'mostarda',
  onPress,
  onComments,
  onLike,
  onSave,
  onAuthorPress,
  saved,
}: {
  review: Review;
  tone?: QuoteTone;
  onPress?: () => void;
  onComments?: () => void;
  onLike?: () => void;
  onSave?: () => void;
  onAuthorPress?: () => void;
  // Definido = controlado (App decide); ausente = estado visual local.
  saved?: boolean;
}) {
  const bg = TONE_BG[tone];
  const ink = TONE_INK[tone];
  const handle = review.author?.handle ?? review.userId;
  const nome =
    review.restaurant?.name ?? restaurantName(review.restaurantId);
  const avatarBg =
    tone === 'mostarda'
      ? 'rgba(36,26,34,0.25)'
      : 'rgba(255,255,255,0.25)';
  const initial = handle.charAt(0).toUpperCase();
  const [liked, setLiked] = useState(false);
  const [savedLocal, setSavedLocal] = useState(false);
  const isSaved = saved ?? savedLocal;
  // Fallback D1: sem título, o comment vira o título e não há descrição.
  const title = review.title ?? review.comment;
  const description = review.title ? review.comment : null;

  // Like local não repete (spec 8.3): liked trava o tap.
  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    onLike?.();
  };

  const handleSave = () => {
    if (saved === undefined) setSavedLocal((v) => !v);
    onSave?.();
  };

  const body = (
    <>
      {/* top row: avatar translúcido 28, @handle, estrelas no ink do card */}
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
        <Text style={[s.uname, { color: ink }]}>@{handle}</Text>
        <View style={s.starWrap}>
          <StarRating rating={review.rating} color={ink} />
        </View>
      </Pressable>

      {/* título grande (fallback D1) + descrição com ler-mais */}
      {title ? (
        <Text style={[s.title, { color: ink }]} numberOfLines={3}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <ReadMoreText
          text={description}
          numberOfLines={3}
          style={[s.desc, { color: ink }]}
          linkColor={ink}
        />
      ) : null}

      {/* meta: restaurante + ações no ink do card + tempo */}
      <View style={s.meta}>
        <Text style={[s.place, { color: ink }]} numberOfLines={1}>
          {nome ?? ''}
        </Text>
        <View style={s.metaRight}>
          <Pressable
            testID={`like-quote-${review.id}`}
            onPress={handleLike}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="curtir avaliação"
            accessibilityState={{ selected: liked }}
            style={s.actionItem}
          >
            <Text style={[s.actionIcon, { color: ink }]}>
              {liked ? '♥' : '♡'}
            </Text>
            <Text style={[s.actionText, { color: ink }]}>
              {review.likes + (liked ? 1 : 0)}
            </Text>
          </Pressable>
          {onComments ? (
            <Pressable
              testID={`comentar-quote-${review.id}`}
              onPress={onComments}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="abrir comentários"
              style={s.actionItem}
            >
              <Text style={[s.actionIcon, { color: ink }]}>💬</Text>
              <Text style={[s.actionText, { color: ink }]}>
                {review.commentCount ?? ''}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            testID={`salvar-quote-${review.id}`}
            onPress={handleSave}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'remover dos salvos' : 'salvar lugar'}
            accessibilityState={{ selected: isSaved }}
            style={s.actionItem}
          >
            <Text style={[s.actionIcon, { color: ink }]}>
              {isSaved ? '🔖' : '☆'}
            </Text>
          </Pressable>
          <Text style={[s.time, { color: ink }]}>
            {formatRelativeLong(review.createdAt)}
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
    marginTop: spacing.medio,
    marginBottom: spacing.grande + spacing.micro, // 24
    borderRadius: 16,
    padding: spacing.padrao,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 13,
    marginRight: 'auto',
  },
  starWrap: { marginLeft: 'auto' },
  title: {
    fontFamily: fonts.display700,
    fontSize: 22,
    lineHeight: 28,
    marginTop: spacing.padrao,
    marginBottom: spacing.medio,
  },
  desc: {
    fontFamily: fonts.corpo500,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.medio,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.interno,
  },
  place: {
    fontSize: 12,
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
