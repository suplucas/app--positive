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
import { Avatar } from './Avatar';
import { formatRelative, getNote, restaurantName } from './format';
import { fonts, palette, spacing, useTheme } from './theme';
import type { Review } from './types';

// Post com foto: mídia edge-to-edge (sangra na borda), nota sobre a
// imagem. Mesmo peso visual de um post, sem moldura de card.
// `photos` com 2+ itens vira **carrossel** (docs/15): paginação
// nativa (ScrollView + paging) com dots e contador; 1 foto mantém o
// comportamento atual (sem UI de carrossel). `onPress` (opcional) abre
// a página do restaurante. `variant` v2 é a UI de teste: autor/
// restaurante/tempo vão para DENTRO da imagem (com scrim no topo), a
// foto fica mais alta e a nota desce pro rodapé.
export function FeedPhoto({
  review,
  photos,
  onPress,
  onComments,
  variant = 'v1',
}: {
  review: Review;
  photos: ImageSourcePropType[];
  onPress?: () => void;
  // docs/12: abre a thread de comentários (opcional, como `onPress`).
  onComments?: () => void;
  variant?: 'v1' | 'v2';
}) {
  const t = useTheme();
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(0);
  const { width: winW } = useWindowDimensions();
  const v2 = variant === 'v2';
  const multi = photos.length > 1;
  const photoH = v2 ? 480 : 420;
  const nome = restaurantName(review.restaurantCnpj);

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

  const meta = (
    <>
      <Avatar userId={review.userId} size={30} />
      <Text style={[s.uname, { color: v2 ? palette.papel : t.ink }]}>
        {review.userId}
      </Text>
      {nome ? (
        <Text
          style={[s.place, { color: v2 ? 'rgba(242,240,239,0.75)' : t.sub }]}
          numberOfLines={1}
        >
          em{' '}
          <Text
            style={[s.placeName, { color: v2 ? palette.papel : t.ink }]}
          >
            {nome}
          </Text>
        </Text>
      ) : null}
      <Text style={[s.time, { color: v2 ? 'rgba(242,240,239,0.75)' : t.sub }]}>
        {formatRelative(review.createdAt)}
      </Text>
    </>
  );

  const body = (
    <>
      {/* v1: linha acima da foto. v2: ela vai para dentro (topOverlay). */}
      {v2 ? null : <View style={s.top}>{meta}</View>}

      <View style={s.photoWrap} testID={`photo-${review.id}-frame`}>
        {media}
        {v2 ? <View testID={`photo-${review.id}-scrim`} style={s.scrim} /> : null}
        {v2 ? <View style={s.topOverlay}>{meta}</View> : null}
        <View
          testID={`photo-${review.id}-note`}
          style={v2 ? s.noteBottom : s.note}
        >
          <Text style={s.noteText}>{getNote(review.rating)}</Text>
        </View>
        {multi ? (
          <View
            testID={`carousel-dots-${review.id}`}
            style={s.dots}
          >
            {photos.map((_, i) => (
              <View
                key={i}
                testID={`carousel-dot-${review.id}-${i}`}
                style={i === page ? s.dotActive : s.dot}
              />
            ))}
            <Text
              testID={`carousel-count-${review.id}`}
              style={s.count}
            >
              {`${page + 1}/${photos.length}`}
            </Text>
          </View>
        ) : null}
      </View>

      {review.comment ? (
        <Text style={[s.caption, { color: t.ink }]}>{review.comment}</Text>
      ) : null}

      <View style={s.actions}>
        <Text style={[s.action, { color: t.sub }]}>▲ {review.likes}</Text>
        {onComments ? (
          <Pressable
            testID={`comentar-photo-${review.id}`}
            onPress={onComments}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="abrir comentários"
          >
            <Text style={[s.action, { color: t.sub }]}>💬</Text>
          </Pressable>
        ) : null}
        <Pressable
          testID={`salvar-${review.id}`}
          onPress={() => setSaved((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'remover dos salvos' : 'salvar post'}
          accessibilityState={{ selected: saved }}
        >
          <Text style={[s.action, { color: saved ? t.ink : t.sub }]}>
            {saved ? 'salvo' : 'salvar'}
          </Text>
        </Pressable>
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
    paddingVertical: spacing.padrao - 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno + 2,
  },
  uname: { fontFamily: fonts.display700, fontSize: 13.5 },
  place: { fontSize: 12.5, flexShrink: 1 },
  placeName: { fontFamily: fonts.corpo600, fontWeight: '600' },
  time: { marginLeft: 'auto', fontSize: 12 },
  photoWrap: { position: 'relative' },
  photo: { width: '100%' },
  // v2: leve escuro no topo da foto p/ a linha de texto ter contraste
  // (sem lib de gradiente nos deps).
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(36,26,34,0.45)',
  },
  topOverlay: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  note: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(36,26,34,0.82)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  noteBottom: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(36,26,34,0.82)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  noteText: {
    fontFamily: fonts.display800,
    fontSize: 14,
    color: palette.papel,
  },
  // Carrossel (docs/15): um único momento de movimento — o dot ativo é
  // um pill lambe-lambe; o resto fica quieto sobre a foto.
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(242,240,239,0.55)',
  },
  dotActive: {
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.lambeLambe,
  },
  count: {
    fontSize: 11,
    fontFamily: fonts.display700,
    color: palette.papel,
    marginLeft: 3,
    textShadowColor: 'rgba(36,26,34,0.6)',
    textShadowRadius: 4,
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno + 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.padrao,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno + 2,
  },
  action: { fontSize: 12 },
});
