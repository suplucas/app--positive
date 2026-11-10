import { useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Flair } from './Flair';
import { StarRating } from './StarRating';
import { avatarColor, formatRelative, restaurantName } from '../common/format';
import { fonts, palette, radius, spacing, type, useTheme } from '../common/theme';
import type { Review } from '../common/types';

export function FeedPhoto({
  review,
  photos,
  strong = false,
  onPress,
  onComments,
  onLike,
  onAuthorPress,
  onEdit,
  onDelete,
}: {
  review: Review;
  photos: ImageSourcePropType[];
  strong?: boolean;
  onPress?: () => void;
  onComments?: () => void;
  onLike?: () => void;
  onAuthorPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const t = useTheme();
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [page, setPage] = useState(0);
  const { width: winW } = useWindowDimensions();
  const multi = photos.length > 1;
  const photoH = Math.round(winW * (5 / 4));
  const nome = restaurantName(review.restaurantId);
  const avatarBg = avatarColor(review.userId);
  const initial = review.userId.charAt(0).toUpperCase();

  const handleLike = () => {
    setLiked((v) => !v);
    onLike?.();
  };

  const media = multi ? (
    <ScrollView
      testID={`carousel-${review.id}`}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const x = e.nativeEvent?.contentOffset?.x ?? 0;
        const p = Math.round(x / winW);
        setPage(Math.min(Math.max(p, 0), photos.length - 1));
      }}
    >
      {photos.map((src, i) => (
        <Image
          key={i}
          source={src}
          style={{ width: winW, height: photoH }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel={`foto ${i + 1} de ${photos.length}`}
        />
      ))}
    </ScrollView>
  ) : (
    <Image
      testID={`photo-${review.id}-img`}
      source={photos[0]!}
      style={[s.photo, { height: photoH }]}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );

  const body = (
    <>
      {/* Header row: avatar initial, username, restaurant, stars */}
      <Pressable
        style={s.fh}
        testID={`author-${review.id}`}
        onPress={onAuthorPress}
        disabled={!onAuthorPress}
        hitSlop={6}
        accessibilityRole={onAuthorPress ? 'button' : undefined}
      >
        <View style={[s.avatarCircle, { backgroundColor: avatarBg }]}>
          <Text style={s.avatarInitial}>{initial}</Text>
        </View>
        <View style={s.who}>
          <Text style={[s.uname, { color: t.ink }]}>@{review.userId}</Text>
          {nome ? (
            <Text style={[s.place, { color: t.sub }]} numberOfLines={1}>
              <Text style={[s.placeBold, { color: t.ink }]}>{nome}</Text>
            </Text>
          ) : null}
        </View>
        <StarRating rating={review.rating} />
      </Pressable>

      {/* Photo with bottom overlay */}
      <View style={s.photoWrap} testID={`photo-${review.id}-frame`}>
        {media}
        {/* gradient overlay at bottom */}
        <View testID={`photo-${review.id}-scrim`} style={s.gradient} />
        {/* title / caption over photo */}
        {review.comment ? (
          <View style={s.ftitle}>
            <Text style={s.overlayText} numberOfLines={3}>
              {review.comment}
            </Text>
          </View>
        ) : null}
        {/* carousel dots */}
        {multi ? (
          <View testID={`carousel-dots-${review.id}`} style={s.dots}>
            {photos.map((_, i) => (
              <View
                key={i}
                testID={`carousel-dot-${review.id}-${i}`}
                style={i === page ? s.dotActive : s.dot}
              />
            ))}
            <Text testID={`carousel-count-${review.id}`} style={s.count}>
              {`${page + 1}/${photos.length}`}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Action bar */}
      <View style={s.actions} testID={`actions-${review.id}`}>
        <Pressable
          testID={`like-photo-${review.id}`}
          onPress={handleLike}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="curtir"
          style={s.actionItem}
        >
          <Text style={[s.actionIcon, { color: liked ? palette.lambeLambe : t.sub }]}>
            {liked ? '♥' : '♡'}
          </Text>
          <Text style={[s.actionCount, { color: t.sub }]}>
            {review.likes + (liked ? 1 : 0)}
          </Text>
        </Pressable>
        {onComments ? (
          <Pressable
            testID={`comentar-photo-${review.id}`}
            onPress={onComments}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="abrir comentários"
            style={s.actionItem}
          >
            <Text style={[s.actionIcon, { color: t.sub }]}>💬</Text>
          </Pressable>
        ) : null}
        {onEdit ? (
          <Pressable
            testID={`editar-${review.id}`}
            onPress={onEdit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="editar avaliação"
          >
            <Text style={[s.actionText, { color: t.sub }]}>editar</Text>
          </Pressable>
        ) : null}
        {onDelete ? (
          <Pressable
            testID={`apagar-${review.id}`}
            onPress={onDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="apagar avaliação"
          >
            <Text style={[s.actionText, { color: palette.lambeLambe }]}>apagar</Text>
          </Pressable>
        ) : null}
        <Pressable
          testID={`salvar-${review.id}`}
          onPress={() => setSaved((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'remover dos salvos' : 'salvar post'}
          accessibilityState={{ selected: saved }}
          style={s.saveBtn}
        >
          <Text style={[s.actionIcon, { color: saved ? t.ink : t.sub }]}>
            {saved ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      {/* Flairs + time */}
      <View style={s.fflairs}>
        {review.flairs?.map((fl, i) => (
          <Flair key={i} label={fl} strong={strong && i === 0} />
        ))}
        <Text style={[s.time, { color: t.sub }]}>
          {formatRelative(review.createdAt)}
        </Text>
      </View>
    </>
  );

  const style = [s.post, { borderBottomColor: t.line }];
  return onPress ? (
    <Pressable
      style={({ pressed }) => [...style, pressed && { opacity: 0.85 }]}
      testID={`photo-${review.id}`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`avaliações em ${nome ?? 'restaurante'}`}
    >
      {body}
    </Pressable>
  ) : (
    <View style={style} testID={`photo-${review.id}`}>
      {body}
    </View>
  );
}

const s = StyleSheet.create({
  post: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.interno,
  },
  /* header row */
  fh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 12,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontFamily: fonts.display800,
    fontSize: 13,
    color: '#fff',
  },
  who: { flex: 1, minWidth: 0 },
  uname: { fontFamily: fonts.display700, fontSize: 14 },
  place: { fontSize: 12, marginTop: 1 },
  placeBold: { fontFamily: fonts.corpo600, fontWeight: '600' },
  /* photo */
  photoWrap: { position: 'relative' },
  photo: { width: '100%' },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0)',
    // simulate gradient via nested Views (React Native has no linear gradient in core)
  },
  ftitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 80,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  overlayText: {
    fontFamily: fonts.display700,
    fontSize: 17,
    lineHeight: 23,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  /* carousel dots */
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.micro,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(242,242,228,0.55)',
  },
  dotActive: {
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.lambeLambe,
  },
  count: {
    fontSize: type.caption,
    fontFamily: fonts.display700,
    color: palette.papel,
    marginLeft: 3,
    textShadowColor: 'rgba(36,26,34,0.6)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  /* action bar */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: spacing.padrao,
    paddingTop: 10,
    paddingBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: { fontSize: 20 },
  actionCount: { fontSize: type.body },
  actionText: { fontSize: type.small, fontFamily: fonts.corpo500 },
  saveBtn: { marginLeft: 'auto' },
  /* flairs */
  fflairs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno,
  },
  time: {
    fontSize: 12,
    marginLeft: 'auto',
  },
});
