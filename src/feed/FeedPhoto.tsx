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
import { LinearGradient } from 'expo-linear-gradient';
import { ReadMoreText } from '../common/ReadMoreText';
import { StarRating } from './StarRating';
import {
  avatarColor,
  formatRelativeLong,
  resolvePhotoUrl,
  restaurantName,
} from '../common/format';
import { fonts, palette, spacing, type, useTheme } from '../common/theme';
import type { Review } from '../common/types';

// Card de foto do feed v1 (spec 8.3): header com avatar/@handle/restaurante,
// foto 4:5 com scrim LinearGradient e overlay de título (fallback D1:
// `title ?? comment`) + descrição com ler-mais, ações (curtir travado,
// comentar com count, salvar controlado) e tempo por extenso. Sem flair e
// sem borda — os cards se separam por marginBottom 24.
export function FeedPhoto({
  review,
  photos,
  onPress,
  onComments,
  onLike,
  onSave,
  onAuthorPress,
  saved,
}: {
  review: Review;
  photos: ImageSourcePropType[];
  onPress?: () => void;
  onComments?: () => void;
  onLike?: () => void;
  onSave?: () => void;
  onAuthorPress?: () => void;
  // Definido = controlado (App decide); ausente = estado visual local.
  saved?: boolean;
}) {
  const t = useTheme();
  const [liked, setLiked] = useState(false);
  const [savedLocal, setSavedLocal] = useState(false);
  const [page, setPage] = useState(0);
  const { width: winW } = useWindowDimensions();
  const multi = photos.length > 1;
  const photoH = Math.round(winW * (5 / 4));
  const handle = review.author?.handle ?? review.userId;
  const nome =
    review.restaurant?.name ?? restaurantName(review.restaurantId);
  const loc = review.restaurant?.location ?? null;
  const avatarBg = avatarColor(review.userId);
  const initial = handle.charAt(0).toUpperCase();
  const isSaved = saved ?? savedLocal;
  // Fallback D1: post antigo sem título mostra o comment como título e
  // fica sem descrição.
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
      {/* Header: avatar 34, @handle, restaurante + location, estrelas */}
      <Pressable
        style={s.fh}
        testID={`author-${review.id}`}
        onPress={onAuthorPress}
        disabled={!onAuthorPress}
        hitSlop={6}
        accessibilityRole={onAuthorPress ? 'button' : undefined}
      >
        {review.author?.photoUrl ? (
          <Image
            source={{ uri: resolvePhotoUrl(review.author.photoUrl) }}
            style={s.avatarPhoto}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[s.avatarCircle, { backgroundColor: avatarBg }]}>
            <Text style={s.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={s.who}>
          <Text style={[s.uname, { color: t.ink }]}>@{handle}</Text>
          {nome ? (
            <Text style={[s.place, { color: t.sub }]} numberOfLines={1}>
              <Text style={[s.placeBold, { color: t.ink }]}>{nome}</Text>
              {loc ? (
                <Text style={s.placeLoc}>{` · ${loc}`}</Text>
              ) : null}
            </Text>
          ) : null}
        </View>
        <StarRating rating={review.rating} />
      </Pressable>

      {/* Foto 4:5 com scrim e overlay de título/descrição */}
      <View style={s.photoWrap} testID={`photo-${review.id}-frame`}>
        {media}
        <LinearGradient
          testID={`photo-${review.id}-scrim`}
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']}
          style={s.gradient}
        >
          {title ? (
            <>
              <Text style={s.overlayTitle} numberOfLines={2}>
                {title}
              </Text>
              {description ? (
                <ReadMoreText
                  text={description}
                  numberOfLines={2}
                  style={s.overlayDesc}
                />
              ) : null}
            </>
          ) : null}
        </LinearGradient>
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

      {/* Ações: curtir (travado), comentar com count, salvar à direita */}
      <View style={s.actions} testID={`actions-${review.id}`}>
        <Pressable
          testID={`like-photo-${review.id}`}
          onPress={handleLike}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="curtir"
          accessibilityState={{ selected: liked }}
          style={s.actionItem}
        >
          <Text
            style={[s.actionIcon, { color: liked ? palette.lambeLambe : t.sub }]}
          >
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
            <Text style={[s.actionCount, { color: t.sub }]}>
              {review.commentCount ?? ''}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          testID={`salvar-${review.id}`}
          onPress={handleSave}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'remover dos salvos' : 'salvar lugar'}
          accessibilityState={{ selected: isSaved }}
          style={s.saveBtn}
        >
          <Text style={[s.actionIcon, { color: isSaved ? palette.mostarda : t.sub }]}>
            {isSaved ? '🔖' : '☆'}
          </Text>
        </Pressable>
      </View>

      {/* Tempo por extenso na linha abaixo das ações */}
      <Text style={[s.time, { color: t.sub }]}>
        {formatRelativeLong(review.createdAt)}
      </Text>
    </>
  );

  const style = [s.post];
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
    marginBottom: spacing.grande + spacing.micro, // 24
  },
  /* header row */
  fh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.medio,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarPhoto: {
    width: 34,
    height: 34,
    borderRadius: 17,
    flexShrink: 0,
  },
  avatarInitial: {
    fontFamily: fonts.display800,
    fontSize: type.body,
    color: palette.papel,
  },
  who: { flex: 1, minWidth: 0 },
  uname: { fontFamily: fonts.display700, fontSize: type.bodyLarge },
  place: { fontSize: type.small, marginTop: 1 },
  placeBold: { fontFamily: fonts.corpo600, fontWeight: '600' },
  placeLoc: { fontFamily: fonts.corpo, fontSize: type.caption },
  /* photo */
  photoWrap: { position: 'relative' },
  photo: { width: '100%' },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    paddingTop: 112,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.padrao,
  },
  overlayTitle: {
    fontFamily: fonts.display700,
    fontSize: 17,
    lineHeight: 22,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  overlayDesc: {
    fontFamily: fonts.corpo500,
    fontSize: type.body,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.92)',
    marginTop: spacing.micro,
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
    paddingBottom: spacing.interno,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: { fontSize: 20 },
  actionCount: { fontSize: type.body },
  saveBtn: { marginLeft: 'auto' },
  /* tempo */
  time: {
    fontSize: type.small,
    paddingHorizontal: spacing.padrao,
    marginTop: spacing.micro,
  },
});
