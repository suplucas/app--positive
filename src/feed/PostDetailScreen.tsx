import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StarRating } from './StarRating';
import { photosFor } from './postPhotos';
import type { QuoteTone } from './FeedQuote';
import { useComments } from '../comments/useComments';
import { layout } from '../common/layout';
import {
  avatarColor,
  formatRelative,
  formatRelativeLong,
  formatShortDate,
  resolvePhotoUrl,
  restaurantName,
} from '../common/format';
import { fonts, palette, spacing, type, useTheme } from '../common/theme';
import type { Review } from '../common/types';

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

// Visita expandida (spec 8.4): substitui a CommentThreadScreen. Header
// `← visita`, autor como no feed, hero (foto 4:5 com scrim e título 17 ou
// card colorido raio 18 com título 23 + descrição 15), descrição inteira
// (photo), data curta + relativa, ações, comentários e composer pill.
export function PostDetailScreen({
  review,
  authorId,
  onBack,
  tone = 'mostarda',
}: {
  review: Review;
  authorId?: string;
  onBack: () => void;
  // Tom do card quando o post não tem foto (mesmo default do FeedQuote).
  tone?: QuoteTone;
}) {
  const t = useTheme();
  const { comments, status, send } = useComments(review.id, authorId);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const { width: winW } = useWindowDimensions();

  const handle = review.author?.handle ?? review.userId;
  const nome =
    review.restaurant?.name ?? restaurantName(review.restaurantId);
  const loc = review.restaurant?.location ?? null;
  const avatarBg = avatarColor(review.userId);
  const initial = handle.charAt(0).toUpperCase();
  const photoH = Math.round(winW * (5 / 4));
  // Fallback D1: post antigo sem título mostra o comment como título e
  // fica sem descrição.
  const title = review.title ?? review.comment;
  const description = review.title ? review.comment : null;

  const hasMockPhotos =
    review.photoIndex != null ||
    (review.photoIndexes != null && review.photoIndexes.length > 0);
  const photos = review.photoUrl
    ? [{ uri: resolvePhotoUrl(review.photoUrl) }]
    : hasMockPhotos
      ? photosFor(review, 0)
      : [];
  const isPhoto = photos.length > 0;
  const cardInk = TONE_INK[tone];

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    setError(null);
    try {
      await send(text);
      setDraft('');
    } catch {
      setError('Não consegui comentar agora. Tente de novo.');
    }
  };

  return (
    <View style={[s.wrap, { backgroundColor: t.bg }]}>
      <View
        style={[layout.topbar, layout.divider, { borderBottomColor: t.line }]}
      >
        <Pressable
          testID="voltar"
          onPress={onBack}
          style={[s.backBtn, { backgroundColor: palette.overlay }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="voltar"
        >
          <Text style={[layout.backIcon, { color: palette.papel }]}>←</Text>
        </Pressable>
        <Text style={[s.title, { color: t.ink }]}>visita</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* autor como no feed: avatar 34, @handle, restaurante, estrelas */}
        <View style={s.fh}>
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
        </View>

        {/* hero */}
        {isPhoto ? (
          <View style={s.photoWrap} testID="post-hero">
            <Image
              testID="post-hero-img"
              source={photos[0]!}
              style={{ width: '100%', height: photoH }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <LinearGradient
              testID="post-hero-scrim"
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']}
              style={s.gradient}
            >
              {title ? (
                <Text testID="post-hero-title" style={s.overlayTitle}>
                  {title}
                </Text>
              ) : null}
            </LinearGradient>
          </View>
        ) : (
          <View
            testID="post-quote-card"
            style={[s.quoteCard, { backgroundColor: TONE_BG[tone] }]}
          >
            {title ? (
              <Text
                testID="post-quote-title"
                style={[s.quoteTitle, { color: cardInk }]}
              >
                {title}
              </Text>
            ) : null}
            {description ? (
              <Text
                testID="post-quote-desc"
                style={[s.quoteDesc, { color: cardInk }]}
              >
                {description}
              </Text>
            ) : null}
          </View>
        )}

        {/* descrição inteira (photo): display500 15/22 */}
        {isPhoto && description ? (
          <Text testID="post-desc" style={[s.desc, { color: t.ink }]}>
            {description}
          </Text>
        ) : null}

        <Text testID="post-date" style={[s.date, { color: t.sub }]}>
          {`${formatShortDate(review.createdAt)} · ${formatRelativeLong(review.createdAt)}`}
        </Text>

        {/* ações: curtir travado, comentários count, salvar */}
        <View style={s.actions} testID="post-actions">
          <Pressable
            testID={`like-post-${review.id}`}
            onPress={() => {
              if (liked) return;
              setLiked(true);
            }}
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
          <View style={s.actionItem}>
            <Text style={[s.actionIcon, { color: t.sub }]}>💬</Text>
            <Text style={[s.actionCount, { color: t.sub }]}>
              {review.commentCount ?? ''}
            </Text>
          </View>
          <Pressable
            testID={`salvar-post-${review.id}`}
            onPress={() => setSaved((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'remover dos salvos' : 'salvar lugar'}
            accessibilityState={{ selected: saved }}
            style={s.saveBtn}
          >
            <Text
              style={[s.actionIcon, { color: saved ? palette.mostarda : t.sub }]}
            >
              {saved ? '🔖' : '☆'}
            </Text>
          </Pressable>
        </View>

        <Text style={[s.ctitle, { color: t.sub, borderTopColor: t.line }]}>
          comentários
        </Text>

        {status === 'loading' ? (
          <Text style={[s.loading, { color: t.sub }]}>carregando…</Text>
        ) : null}

        {comments.map((c) => (
          <View
            key={c.id}
            testID={`comentario-${c.id}`}
            style={[s.comment, { borderBottomColor: t.line }]}
          >
            <View
              style={[s.commentAvatar, { backgroundColor: avatarColor(c.userId) }]}
            >
              <Text style={s.commentInitial}>
                {c.userId.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.commentBody}>
              <Text style={[s.commentText, { color: t.ink }]}>
                <Text style={s.commentUser}>@{c.userId}</Text>
                {` ${c.text}`}
              </Text>
              <Text style={[s.commentTime, { color: t.sub }]}>
                {formatRelative(c.createdAt)}
              </Text>
            </View>
          </View>
        ))}

        {error ? (
          <Text
            testID="comentario-erro"
            style={[s.error, { color: palette.lambeLambe }]}
          >
            {error}
          </Text>
        ) : null}

        <View style={[s.composer, { borderColor: t.line }]}>
          <TextInput
            testID="comentario-novo"
            value={draft}
            onChangeText={setDraft}
            placeholder="comentar…"
            placeholderTextColor={t.sub}
            style={[s.composerInput, { color: t.ink }]}
            accessibilityLabel="comentar"
          />
          <Pressable
            testID="comentar"
            onPress={() => void submit()}
            disabled={draft.trim() === ''}
            style={[
              s.send,
              {
                backgroundColor: palette.lambeLambe,
                opacity: draft.trim() === '' ? 0.4 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: draft.trim() === '' }}
          >
            <Text style={s.sendText}>comentar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display800,
    fontSize: 19,
    lineHeight: 24,
  },
  scroll: { paddingBottom: spacing.bloco },
  /* autor */
  fh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  /* hero photo */
  photoWrap: { position: 'relative' },
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
  /* hero quote */
  quoteCard: {
    marginHorizontal: spacing.padrao,
    marginVertical: spacing.micro,
    borderRadius: 18,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: spacing.padrao,
  },
  quoteTitle: {
    fontFamily: fonts.display700,
    fontSize: 23,
    lineHeight: 28,
  },
  quoteDesc: {
    fontFamily: fonts.corpo500,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  /* descrição inteira (photo) */
  desc: {
    fontFamily: fonts.corpo500,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
    paddingBottom: spacing.micro,
  },
  date: {
    fontSize: type.small,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.micro,
  },
  /* ações */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: spacing.padrao,
    paddingTop: 12,
    paddingBottom: spacing.interno,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: { fontSize: 20 },
  actionCount: { fontSize: type.body },
  saveBtn: { marginLeft: 'auto' },
  /* comentários */
  ctitle: {
    fontFamily: fonts.display700,
    fontSize: type.body,
    marginTop: 12,
    paddingTop: spacing.padrao,
    paddingBottom: 8,
    paddingHorizontal: spacing.padrao,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  loading: {
    padding: spacing.padrao,
    fontFamily: fonts.corpo,
    fontSize: type.body,
  },
  comment: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentInitial: {
    fontFamily: fonts.display800,
    fontSize: type.caption,
    color: palette.papel,
  },
  commentBody: { flex: 1, minWidth: 0 },
  commentText: {
    fontFamily: fonts.corpo,
    fontSize: type.body,
    lineHeight: 19,
  },
  commentUser: { fontFamily: fonts.corpo600, fontWeight: '600' },
  commentTime: {
    fontFamily: fonts.corpo,
    fontSize: type.caption,
    marginTop: 2,
  },
  error: {
    fontFamily: fonts.corpo,
    fontSize: type.small,
    padding: spacing.padrao,
  },
  /* composer */
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.padrao,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 16,
    paddingRight: 4,
  },
  composerInput: {
    flex: 1,
    fontFamily: fonts.corpo,
    fontSize: type.body,
    minHeight: 40,
  },
  send: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontFamily: fonts.display700,
    fontSize: type.body,
    color: palette.papel,
  },
});
