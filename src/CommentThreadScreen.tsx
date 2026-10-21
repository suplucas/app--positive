import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar } from './Avatar';
import { formatRelative, getNote, restaurantName } from './format';
import { SectionTitle } from './SectionTitle';
import { useComments } from './useComments';
import { fonts, palette, spacing, useTheme } from './theme';
import type { Review } from './types';

// Thread de comentários da review (docs/12): abre pelo 💬 dos cards de
// feed. Comentários e envio persistem na API.
export function CommentThreadScreen({
  review,
  authorId,
  onBack,
}: {
  review: Review;
  authorId?: string;
  onBack: () => void;
}) {
  const t = useTheme();
  const { comments, status, send } = useComments(review.id, authorId);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const nome = restaurantName(review.restaurantId);

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
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.topbar}>
        <Pressable
          testID="voltar"
          onPress={onBack}
          style={[s.tbtn, { backgroundColor: 'rgba(36,26,34,0.55)' }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="voltar"
        >
          <Text style={[s.tbtnText, { color: '#fff' }]}>←</Text>
        </Pressable>
      </View>

      <SectionTitle>{`comentários · ${comments.length}`}</SectionTitle>

      {/* A review em si, compacta no topo da conversa */}
      <View
        testID="comentario-original"
        style={[s.original, { backgroundColor: t.quietBg }]}
      >
        <Avatar userId={review.userId} size={40} />
        <View style={s.origBody}>
          <View style={s.origTop}>
            <Text style={[s.origUser, { color: t.ink }]}>{review.userId}</Text>
            {nome ? (
              <Text style={[s.origPlace, { color: t.sub }]}>
                em {nome} · {getNote(review.rating)}
              </Text>
            ) : null}
          </View>
          {review.comment ? (
            <Text style={[s.origText, { color: t.ink }]}>
              {review.comment}
            </Text>
          ) : null}
        </View>
      </View>

      {status === 'loading' ? (
        <Text style={[s.itemText, { color: t.sub, paddingHorizontal: spacing.padrao }]}>
          carregando…
        </Text>
      ) : null}

      {comments.map((c) => (
        <View
          key={c.id}
          testID={`comentario-${c.id}`}
          style={[s.item, { borderBottomColor: t.line }]}
        >
          <Avatar userId={c.userId} size={26} />
          <View style={s.itemBody}>
            <Text style={[s.itemUser, { color: t.ink }]}>{c.userId}</Text>
            <Text style={[s.itemText, { color: t.ink }]}>{c.text}</Text>
            <Text style={[s.itemTime, { color: t.sub }]}>
              {formatRelative(c.createdAt)}
            </Text>
          </View>
        </View>
      ))}

      {error ? (
        <Text testID="comentario-erro" style={[s.itemTime, { color: palette.lambeLambe, paddingHorizontal: spacing.padrao }]}>
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
          onPress={submit}
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

      <Text style={[s.footer, { color: t.sub }]}>
        Comentários da comunidade.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  topbar: { paddingTop: spacing.padrao, paddingHorizontal: spacing.padrao },
  tbtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbtnText: { fontSize: 14 },
  original: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: spacing.padrao,
    borderRadius: 12,
    padding: spacing.interno,
    marginBottom: spacing.interno,
  },
  origBody: { flex: 1, minWidth: 0 },
  origTop: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  origUser: { fontFamily: fonts.display700, fontSize: 13 },
  origPlace: { fontSize: 11.5 },
  origText: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  item: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.interno,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemUser: { fontFamily: fonts.display700, fontSize: 12.5 },
  itemText: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  itemTime: { fontSize: 11, marginTop: 3 },
  composer: {
    flexDirection: 'row',
    gap: spacing.interno,
    alignItems: 'center',
    marginHorizontal: spacing.padrao,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: spacing.padrao,
    paddingLeft: spacing.padrao,
  },
  composerInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.corpo,
    paddingVertical: 10,
  },
  send: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 4,
  },
  sendText: {
    fontSize: 12,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    color: palette.papel,
  },
  footer: {
    fontSize: 11.5,
    lineHeight: 16,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
  },
});
