import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { postReview } from './api';
import { NoteSlider } from './NoteSlider';
import { SectionTitle } from './SectionTitle';
import { restaurantName, searchRestaurants, type RestaurantHit } from './format';
import { MOCK_POST_PHOTOS } from './postPhotos';
import { fonts, palette, spacing, useTheme } from './theme';

// Flairs disponíveis (docs_04): até 2 por avaliação, o primeiro
// selecionado sai quando entra o terceiro (mesma regra do mock).
export const FLAIRS = [
  'volto sim',
  'prato pequeno',
  'fila vale a pena',
  'boa pra ir só',
  'achado',
];
const MAX_FLAIRS = 2;

// Slug estável p/ testID: 'boa pra ir só' → 'flair-boa-pra-ir-so'.
export function flairSlug(label: string): string {
  return (
    'flair-' +
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

// Tela de composição v2 (mock docs/04): local com "trocar", nota 0–10
// com slider, foto opcional, legenda, flairs e preview do quote card.
// FOTO E FLAIRS SÃO SÓ VISUAIS: a API não tem esses campos ainda, o
// POST /reviews continua com cnpj + rating (float, nota/2) + comment.
export function ComposeV2({
  userId,
  initialCnpj,
  onCancel,
  onPosted,
}: {
  userId: string;
  initialCnpj?: string | null;
  onCancel: () => void;
  onPosted: () => void;
}) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RestaurantHit | null>(() =>
    initialCnpj
      ? { cnpj: initialCnpj, nome: restaurantName(initialCnpj) ?? initialCnpj }
      : null,
  );
  const [note, setNote] = useState(8); // padrão do mock: 8.0
  const [caption, setCaption] = useState('');
  const [flairs, setFlairs] = useState<string[]>([]);
  const [photo, setPhoto] = useState<ImageSourcePropType | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(
    () => (selected ? [] : searchRestaurants(query)),
    [query, selected],
  );

  const canSend = selected !== null && !sending;

  const toggleFlair = (label: string) => {
    setFlairs((prev) => {
      if (prev.includes(label)) return prev.filter((f) => f !== label);
      const room = prev.length >= MAX_FLAIRS ? prev.slice(1) : prev;
      return [...room, label];
    });
  };

  const submit = async () => {
    if (!canSend || selected === null) return;
    setSending(true);
    setError(null);
    try {
      await postReview(userId, {
        restaurantCnpj: selected.cnpj,
        rating: note / 2, // API usa escala 0–5; UI usa 0–10
        comment: caption.trim() === '' ? null : caption.trim(),
      });
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSending(false);
    }
  };

  const previewCaption =
    caption.trim() === '' ? 'Como foi? Seja direto.' : caption.trim();

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <SectionTitle>onde você comeu</SectionTitle>
      {selected ? (
        <Pressable
          testID="trocar-restaurante"
          onPress={() => {
            setSelected(null);
            setQuery('');
          }}
          style={[s.place, { backgroundColor: t.quietBg }]}
          accessibilityRole="button"
          accessibilityLabel="trocar restaurante"
        >
          <Text style={s.pin}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.placeNome, { color: t.ink }]}>{selected.nome}</Text>
            <Text style={[s.placeSub, { color: t.sub }]}>{selected.cnpj}</Text>
          </View>
          <Text style={[s.placeTrocar, { color: palette.lambeLambe }]}>
            trocar
          </Text>
        </Pressable>
      ) : (
        <>
          <TextInput
            testID="buscar-v2"
            value={query}
            onChangeText={setQuery}
            placeholder="buscar restaurante por nome…"
            placeholderTextColor={t.sub}
            autoCapitalize="none"
            autoCorrect={false}
            style={[s.input, { backgroundColor: t.quietBg, color: t.ink }]}
            accessibilityLabel="buscar restaurante"
          />
          {results.map((r) => (
            <Pressable
              key={r.cnpj}
              testID={`pick-v2-${r.cnpj}`}
              onPress={() => setSelected(r)}
              style={({ pressed }) => [
                s.result,
                { borderBottomColor: t.line, opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
            >
              <Text style={[s.resultNome, { color: t.ink }]}>{r.nome}</Text>
              <Text style={[s.resultCnpj, { color: t.sub }]}>{r.cnpj}</Text>
            </Pressable>
          ))}
          {query.trim() !== '' && results.length === 0 ? (
            <Text style={[s.empty, { color: t.sub }]}>
              nenhum restaurante com esse nome
            </Text>
          ) : null}
        </>
      )}

      <View style={[s.noteField, { borderBottomColor: t.line, borderTopColor: t.line }]}>
        <SectionTitle>nota</SectionTitle>
        <NoteSlider value={note} onChange={setNote} />
      </View>

      <SectionTitle>foto (opcional)</SectionTitle>
      {photo ? (
        <Pressable
          testID="foto-add"
          onPress={() => setPhoto(null)}
          style={[s.photoBox, { backgroundColor: t.quietBg }]}
          accessibilityRole="button"
          accessibilityLabel="remover foto"
        >
          <Image
            testID="foto-preview"
            source={photo}
            style={s.photo}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <Text style={[s.photoLabel, { color: t.sub }]}>
            foto de exemplo (local) · toque p/ remover
          </Text>
        </Pressable>
      ) : (
        <Pressable
          testID="foto-add"
          onPress={() => setPhoto(MOCK_POST_PHOTOS[0] ?? null)}
          style={[s.photoBox, { borderColor: t.line }]}
          accessibilityRole="button"
          accessibilityLabel="adicionar foto"
        >
          <Text style={s.cam}>📷</Text>
          <Text style={[s.photoText, { color: t.sub }]}>adicionar foto</Text>
          <Text style={[s.photoSub, { color: t.sub }]}>
            sem foto, vira um quote card
          </Text>
        </Pressable>
      )}

      <SectionTitle>o que achou?</SectionTitle>
      <TextInput
        testID="legenda"
        value={caption}
        onChangeText={setCaption}
        placeholder="Como foi? Seja direto."
        placeholderTextColor={t.sub}
        multiline
        style={[s.input, s.commentInput, { backgroundColor: t.quietBg, color: t.ink }]}
        accessibilityLabel="legenda"
      />

      <SectionTitle>flair (até 2)</SectionTitle>
      <View style={s.flairRow}>
        {FLAIRS.map((label) => {
          const on = flairs.includes(label);
          return (
            <Pressable
              key={label}
              testID={flairSlug(label)}
              onPress={() => toggleFlair(label)}
              style={[
                s.flair,
                { borderColor: t.line },
                on && { backgroundColor: palette.picles, borderColor: palette.picles },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[s.flairText, { color: on ? palette.papel : t.sub }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>preview</SectionTitle>
      <View
        testID="preview-v2"
        style={[s.preview, { backgroundColor: palette.mostarda }]}
      >
        <View style={s.previewMeta}>
          <Text style={[s.previewPlace, { color: palette.berinjela }]} numberOfLines={1}>
            {selected?.nome ?? 'restaurante'}
          </Text>
          <Text style={[s.previewNote, { color: palette.berinjela }]}>
            {note.toFixed(1)}
          </Text>
        </View>
        <Text style={[s.previewText, { color: palette.berinjela }]}>
          “{previewCaption}”
        </Text>
      </View>
      <Text style={[s.previewLabel, { color: t.sub }]}>
        Esse é o quote card que aparece no feed e no perfil se nenhuma foto
        for adicionada.
      </Text>

      {error ? (
        <View testID="compose-v2-erro" style={[s.error, { backgroundColor: t.quietBg }]}>
          <Text style={[s.errorText, { color: t.sub }]}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        testID="publicar-v2"
        onPress={() => void submit()}
        disabled={!canSend}
        style={[
          s.publish,
          { backgroundColor: palette.lambeLambe, opacity: canSend ? 1 : 0.4 },
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSend, busy: sending }}
      >
        <Text style={s.publishText}>{sending ? 'publicando…' : 'publicar'}</Text>
      </Pressable>

      <Pressable
        testID="cancelar-v2"
        onPress={onCancel}
        style={s.cancel}
        accessibilityRole="button"
      >
        <Text style={[s.cancelText, { color: t.sub }]}>cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  input: {
    borderRadius: 6,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.interno + 4,
    fontSize: 14,
    fontFamily: fonts.corpo,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
    minHeight: 44,
  },
  commentInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: spacing.interno + 4,
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.padrao,
    borderRadius: 14,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.interno + 4,
    minHeight: 44,
  },
  pin: { fontSize: 16 },
  placeNome: { fontFamily: fonts.display700, fontSize: 14 },
  placeSub: { fontSize: 11.5, marginTop: 1 },
  placeTrocar: { fontSize: 12, fontFamily: fonts.corpo600, fontWeight: '600' },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.interno,
    marginHorizontal: spacing.padrao,
    paddingVertical: spacing.interno,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultNome: { fontSize: 14, fontFamily: fonts.corpo500, flex: 1 },
  resultCnpj: { fontSize: 11.5 },
  empty: {
    fontSize: 13,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
  },
  noteField: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.interno,
    marginTop: spacing.interno,
  },
  photoBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cam: { fontSize: 22 },
  photo: { width: '100%', height: 110 },
  photoLabel: { fontSize: 11, paddingVertical: spacing.interno },
  photoText: { fontSize: 12.5, fontFamily: fonts.corpo600, fontWeight: '600', marginTop: 6 },
  photoSub: { fontSize: 11, opacity: 0.8, marginTop: 2 },
  flairRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
  },
  flair: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  flairText: { fontSize: 12, fontFamily: fonts.corpo500 },
  preview: {
    borderRadius: 16,
    marginHorizontal: spacing.padrao,
    padding: spacing.padrao,
  },
  previewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.interno,
  },
  previewPlace: { fontSize: 11, fontFamily: fonts.corpo600, fontWeight: '600', flex: 1 },
  previewNote: { fontFamily: fonts.display800, fontSize: 15 },
  previewText: {
    fontFamily: fonts.display700,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 10,
  },
  previewLabel: {
    fontSize: 11,
    marginHorizontal: spacing.padrao,
    marginTop: spacing.interno,
  },
  error: {
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
    borderRadius: 5,
    padding: spacing.interno,
  },
  errorText: { fontSize: 12 },
  publish: {
    marginHorizontal: spacing.padrao,
    minHeight: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.interno,
  },
  publishText: {
    color: palette.papel,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    fontSize: 15,
  },
  cancel: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.micro,
  },
  cancelText: { fontSize: 14 },
});
