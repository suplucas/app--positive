import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { postReview } from '../api/api';
import { importPlace, searchPlaces } from '../api/place';
import type { PlaceHit } from '../api/types';
import { NoteSlider } from '../feed/NoteSlider';
import { SectionTitle } from '../common/SectionTitle';
import {
  friendlyApiError,
  restaurantName,
  searchRestaurants,
  type RestaurantHit,
} from '../common/format';
import {
  fonts,
  palette,
  radius,
  spacing,
  type,
  useTheme,
} from '../common/theme';
import { layout } from '../common/layout';

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
// com slider, legenda, flairs e preview do quote card.
// POST /reviews continua com cnpj + rating (float, nota/2) + comment.
export function ComposeV2({
  userId,
  initialCnpj,
  onCancel,
  onPosted,
  onChangePlace,
  pickedCnpj,
}: {
  userId: string;
  initialCnpj?: string | null;
  onCancel: () => void;
  onPosted: () => void;
  // docs/16: "trocar" abre a busca (picker); `pickedCnpj` volta do App.
  onChangePlace?: () => void;
  pickedCnpj?: string | null;
}) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RestaurantHit | null>(() =>
    initialCnpj ? { cnpj: initialCnpj, nome: restaurantName(initialCnpj) ?? initialCnpj } : null,
  );
  const [note, setNote] = useState(8);
  const [caption, setCaption] = useState('');
  const [flairs, setFlairs] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [apiResults, setApiResults] = useState<PlaceHit[]>([]);

  // Busca na API (com fallback OSM); se a API não responder, cai no
  // catálogo local para o dev não ficar sem o campo.
  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setApiResults([]);
      return;
    }
    let active = true;
    searchPlaces(query)
      .then((hits) => {
        if (active) setApiResults(hits);
      })
      .catch(() => {
        if (active) setApiResults([]);
      });
    return () => {
      active = false;
    };
  }, [query, selected]);

  const results = useMemo(() => {
    if (selected) {
      return [] as {
        id: string;
        nome: string;
        source: 'local' | 'osm';
        hit?: PlaceHit;
      }[];
    }
    if (apiResults.length > 0) {
      return apiResults.map((hit) => ({
        id: hit.id,
        nome: hit.nome,
        source: hit.source,
        hit,
      }));
    }
    return searchRestaurants(query).map((hit) => ({
      id: hit.cnpj,
      nome: hit.nome,
      source: 'local' as const,
    }));
  }, [apiResults, query, selected]);

  const choose = async (r: {
    id: string;
    nome: string;
    source: 'local' | 'osm';
    hit?: PlaceHit;
  }) => {
    let id = r.id;
    if (r.source === 'osm' && r.hit) {
      try {
        id = (await importPlace(r.hit)).id;
      } catch {
        id = r.id;
      }
    }
    setSelected({ cnpj: id, nome: r.nome });
    setQuery('');
  };

  // Local escolhido no picker de busca (docs/16) que volta do App.
  useEffect(() => {
    if (pickedCnpj) {
      setSelected({
        cnpj: pickedCnpj,
        nome: restaurantName(pickedCnpj) ?? pickedCnpj,
      });
      setQuery('');
    }
  }, [pickedCnpj]);

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
      const comment = caption.trim() === '' ? null : caption.trim();
      await postReview(userId, {
        restaurantId: selected.cnpj,
        rating: note / 2,
        comment,
        ...(flairs.length > 0 ? { flairs } : {}),
      });
      onPosted();
    } catch (e) {
      console.error(
        JSON.stringify({
          event: 'submit.error',
          error: e instanceof Error ? e.message : String(e),
        }),
      );
      setError(e instanceof Error ? e.message : String(e));
      setSending(false);
    }
  };

  const previewCaption =
    caption.trim() === '' ? 'Como foi? Seja direto.' : caption.trim();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Sub-cabeçalho do mock docs/16: cancelar · nova avaliação · tim! */}
      <View
        style={[
          layout.topbar,
          layout.divider,
          { borderBottomColor: t.line, justifyContent: 'space-between' },
        ]}
      >
        <Pressable
          testID="cancelar-v2"
          onPress={onCancel}
          hitSlop={6}
          style={layout.actionHit}
          accessibilityRole="button"
        >
          <Text style={[s.hbtn, { color: t.sub }]}>cancelar</Text>
        </Pressable>
        <Text style={[s.htitle, { color: t.ink }]}>nova avaliação</Text>
        <Pressable
          testID="publicar-v2"
          onPress={() => void submit()}
          disabled={!canSend}
          style={[
            s.publishBtn,
            { backgroundColor: palette.lambeLambe, opacity: canSend ? 1 : 0.4 },
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend, busy: sending }}
        >
          <Text style={s.publishBtnText}>{sending ? 'tim…' : 'tim!'}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SectionTitle>onde você comeu</SectionTitle>
        {selected ? (
          <Pressable
            testID="trocar-restaurante"
            onPress={() => {
              if (onChangePlace) onChangePlace();
              else {
                setSelected(null);
                setQuery('');
              }
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
                key={r.id}
                testID={`pick-v2-${r.id}`}
                onPress={() => void choose(r)}
                style={({ pressed }) => [
                  s.result,
                  { borderBottomColor: t.line, opacity: pressed ? 0.6 : 1 },
                ]}
                accessibilityRole="button"
              >
                <Text style={[s.resultNome, { color: t.ink }]}>{r.nome}</Text>
                <Text style={[s.resultCnpj, { color: t.sub }]}>{r.id}</Text>
              </Pressable>
            ))}
            {query.trim() !== '' && results.length === 0 ? (
              <Text style={[s.empty, { color: t.sub }]}>
                nenhum restaurante com esse nome
              </Text>
            ) : null}
          </>
        )}

        <View
          style={[
            s.noteField,
            { borderBottomColor: t.line, borderTopColor: t.line },
          ]}
        >
          {/* O rótulo "nota" (centralizado, docs/16) vive dentro do slider. */}
          <NoteSlider value={note} onChange={setNote} />
        </View>

        <SectionTitle>o que achou?</SectionTitle>
        <TextInput
          testID="legenda"
          value={caption}
          onChangeText={setCaption}
          placeholder="Como foi? Seja direto."
          placeholderTextColor={t.sub}
          multiline
          style={[
            s.input,
            s.commentInput,
            { backgroundColor: t.quietBg, color: t.ink },
          ]}
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
                  on && {
                    backgroundColor: palette.picles,
                    borderColor: palette.picles,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text
                  style={[s.flairText, { color: on ? palette.papel : t.sub }]}
                >
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
            <Text
              style={[s.previewPlace, { color: palette.berinjela }]}
              numberOfLines={1}
            >
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
          <View
            testID="compose-v2-erro"
            style={[s.error, { backgroundColor: t.quietBg }]}
          >
            <Text style={[s.errorText, { color: t.sub }]}>
              {friendlyApiError(error, 'publish')}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  hbtn: { fontSize: type.body, fontFamily: fonts.corpo600, fontWeight: '600' },
  htitle: { fontFamily: fonts.display800, fontSize: type.bodyLarge },
  publishBtn: {
    borderRadius: radius.panel,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.interno,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnText: {
    color: palette.papel,
    fontFamily: fonts.display700,
    fontSize: type.body,
  },
  input: {
    borderRadius: 6,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.medio,
    fontSize: type.bodyLarge,
    fontFamily: fonts.corpo,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
    minHeight: 44,
  },
  commentInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: spacing.medio,
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medio,
    marginHorizontal: spacing.padrao,
    borderRadius: 14,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.medio,
    minHeight: 44,
  },
  pin: { fontSize: type.title },
  placeNome: { fontFamily: fonts.display700, fontSize: type.bodyLarge },
  placeSub: { fontSize: 11.5, marginTop: 1 },
  placeTrocar: {
    fontSize: type.small,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
  },
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
  resultNome: { fontSize: type.bodyLarge, fontFamily: fonts.corpo500, flex: 1 },
  resultCnpj: { fontSize: 11.5 },
  empty: {
    fontSize: type.body,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
  },
  noteField: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.interno,
    marginTop: spacing.interno,
  },
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
    paddingVertical: spacing.interno,
  },
  flairText: { fontSize: type.small, fontFamily: fonts.corpo500 },
  preview: {
    borderRadius: radius.panel,
    marginHorizontal: spacing.padrao,
    padding: spacing.padrao,
  },
  previewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.interno,
  },
  previewPlace: {
    fontSize: type.caption,
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    flex: 1,
  },
  previewNote: { fontFamily: fonts.display800, fontSize: 15 },
  previewText: {
    fontFamily: fonts.display700,
    fontSize: type.title,
    lineHeight: 22,
    marginTop: spacing.medio,
  },
  previewLabel: {
    fontSize: type.caption,
    marginHorizontal: spacing.padrao,
    marginTop: spacing.interno,
  },
  error: {
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
    borderRadius: radius.chip,
    padding: spacing.interno,
  },
  errorText: { fontSize: type.small },
});
