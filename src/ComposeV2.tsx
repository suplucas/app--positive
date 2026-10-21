import { useEffect, useMemo, useState } from 'react';
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
import { postReview, uploadReviewPhoto } from './api';
import { importPlace, searchPlaces } from './api/place';
import type { PlaceHit } from './api/types';
import { NoteSlider } from './NoteSlider';
import { SectionTitle } from './SectionTitle';
import {
  friendlyApiError,
  restaurantName,
  searchRestaurants,
  type RestaurantHit,
} from './format';
import { pickPhoto } from './pickPhoto';
import { fonts, palette, spacing, useTheme } from './theme';

// Teto de fotos por avaliação (docs/15). A API persiste 1 foto por
// review nesta fase; o compose acompanha o contrato.
export const MAX_PHOTOS = 1;

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
  onPickPhoto,
  onChangePlace,
  pickedCnpj,
}: {
  userId: string;
  initialCnpj?: string | null;
  onCancel: () => void;
  onPosted: () => void;
  // docs/13: fonte da foto (default = galeria via expo-image-picker).
  // Seam p/ testes injetarem o resultado sem tocar no native.
  onPickPhoto?: () => Promise<ImageSourcePropType | null>;
  // docs/16: "trocar" abre a busca (picker); `pickedCnpj` volta do App.
  onChangePlace?: () => void;
  pickedCnpj?: string | null;
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
  const [photos, setPhotos] = useState<ImageSourcePropType[]>([]);
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

  const addPhoto = () => {
    void (onPickPhoto ?? pickPhoto)().then((src) => {
      if (src) {
        // cancelado (null) → nada muda; teto = MAX_PHOTOS
        setPhotos((prev) =>
          prev.length >= MAX_PHOTOS ? prev : [...prev, src],
        );
      }
    });
  };

  const removePhoto = (i: number) =>
    setPhotos((prev) => prev.filter((_, j) => j !== i));

  const submit = async () => {
    if (!canSend || selected === null) return;
    setSending(true);
    setError(null);
    try {
      const first = photos[0];
      const uri =
        first && typeof first === "object" && "uri" in first
          ? (first as { uri?: string }).uri
          : undefined;
      const photoUrl = uri ? await uploadReviewPhoto(userId, uri) : null;

      await postReview(userId, {
        restaurantId: selected.cnpj,
        rating: note / 2, // API usa escala 0–5; UI usa 0–10
        comment: caption.trim() === "" ? null : caption.trim(),
        ...(photoUrl ? { photoUrl } : {}),
        ...(flairs.length > 0 ? { flairs } : {}),
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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Sub-cabeçalho do mock docs/16: cancelar · nova avaliação · tim! */}
      <View style={[s.subHeader, { borderBottomColor: t.line }]}>
        <Pressable
          testID="cancelar-v2"
          onPress={onCancel}
          hitSlop={6}
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
            // Com picker disponível abre a busca; senão, volta ao campo.
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

      <View style={[s.noteField, { borderBottomColor: t.line, borderTopColor: t.line }]}>
        {/* O rótulo "nota" (centralizado, docs/16) vive dentro do slider. */}
        <NoteSlider value={note} onChange={setNote} />
      </View>

      <SectionTitle>
        {photos.length > 0
          ? `fotos · ${photos.length}/${MAX_PHOTOS}`
          : 'foto (opcional)'}
      </SectionTitle>
      {photos.length === 0 ? (
        <Pressable
          testID="foto-add"
          onPress={addPhoto}
          style={[s.photoBox, { borderColor: t.line }]}
          accessibilityRole="button"
          accessibilityLabel="adicionar foto da galeria"
        >
          <Text style={s.cam}>📷</Text>
          <Text style={[s.photoText, { color: t.sub }]}>adicionar foto</Text>
          <Text style={[s.photoSub, { color: t.sub }]}>
            da sua galeria · 1 foto · sem foto, vira um quote
            card
          </Text>
        </Pressable>
      ) : (
        <>
          <View style={s.shelf}>
            {photos.map((src, i) => (
              <View key={i} testID={`foto-thumb-${i}`} style={s.thumb}>
                <Image
                  testID={i === 0 ? 'foto-preview' : undefined}
                  source={src}
                  style={s.thumbImg}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                <Pressable
                  testID={`foto-tirar-${i}`}
                  onPress={() => removePhoto(i)}
                  style={s.thumbX}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`remover foto ${i + 1}`}
                >
                  <Text style={s.thumbXText}>×</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <Pressable
                testID="foto-add"
                onPress={addPhoto}
                style={[s.addTile, { borderColor: t.line }]}
                accessibilityRole="button"
                accessibilityLabel="adicionar outra foto"
              >
                <Text style={s.cam}>📷</Text>
                <Text style={[s.photoSub, { color: t.sub }]}>
                  {`foto ${photos.length + 1}`}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={[s.photoHint, { color: t.sub }]}>
            foto · vai para a API · × remove
          </Text>
        </>
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
  // Sub-cabeçalho (docs/16).
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.padrao - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hbtn: { fontSize: 13, fontFamily: fonts.corpo600, fontWeight: '600' },
  htitle: { fontFamily: fonts.display800, fontSize: 14 },
  publishBtn: {
    borderRadius: 16,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 7,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnText: {
    color: palette.papel,
    fontFamily: fonts.display700,
    fontSize: 13,
  },
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
  photoText: { fontSize: 12.5, fontFamily: fonts.corpo600, fontWeight: '600', marginTop: 6 },
  // Carrossel em compose (docs/15): fila de miniaturas + tile "foto N".
  shelf: {
    flexDirection: 'row',
    gap: spacing.interno,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.micro,
    alignItems: 'center',
  },
  thumb: {
    position: 'relative',
    width: 92,
    height: 92,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbX: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(36,26,34,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbXText: { color: '#fff', fontSize: 13, lineHeight: 15 },
  addTile: {
    width: 92,
    height: 92,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoHint: {
    fontSize: 11,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
  },
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
});
