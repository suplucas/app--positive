import { useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { formatRelative, getNote, restaurantName } from './format';
import { fonts, palette, spacing, useTheme } from './theme';
import type { Review } from './types';

// Post com foto: mídia edge-to-edge (sangra na borda), nota sobre a
// imagem. Mesmo peso visual de um post, sem moldura de card.
// `onPress` (opcional) abre a página do restaurante.
export function FeedPhoto({
  review,
  photo,
  onPress,
}: {
  review: Review;
  photo: ImageSourcePropType;
  onPress?: () => void;
}) {
  const t = useTheme();
  const [saved, setSaved] = useState(false);
  const nome = restaurantName(review.restaurantCnpj);
  const body = (
    <>
      <View style={s.top}>
        <Avatar userId={review.userId} size={30} />
        <Text style={[s.uname, { color: t.ink }]}>{review.userId}</Text>
        {nome ? (
          <Text style={[s.place, { color: t.sub }]} numberOfLines={1}>
            em <Text style={[s.placeName, { color: t.ink }]}>{nome}</Text>
          </Text>
        ) : null}
        <Text style={[s.time, { color: t.sub }]}>
          {formatRelative(review.createdAt)}
        </Text>
      </View>

      <View style={s.photoWrap}>
        <Image
          source={photo}
          style={s.photo}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={s.note}>
          <Text style={s.noteText}>{getNote(review.rating)}</Text>
        </View>
      </View>

      {review.comment ? (
        <Text style={[s.caption, { color: t.ink }]}>{review.comment}</Text>
      ) : null}

      <View style={s.actions}>
        <Text style={[s.action, { color: t.sub }]}>▲ {review.likes}</Text>
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
  photo: { width: '100%', height: 420 },
  note: {
    position: 'absolute',
    top: 10,
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
