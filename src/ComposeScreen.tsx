import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { postReview } from './api';
import { ComposeV2 } from './ComposeV2';
import { SectionTitle } from './SectionTitle';
import {
  friendlyApiError,
  getNote,
  restaurantName,
  searchRestaurants,
  type RestaurantHit,
} from './format';
import { fonts, spacing, useTheme } from './theme';

type Versao = 'v1' | 'v2';

// Tela de composição com seletor de versão (mesmo padrão do perfil
// v1/v2). v1: layout original (busca + botões 1-5). v2: mock docs_04
// (slider 0-10, flairs, foto opcional e preview do quote card).
export function ComposeScreen({
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
  // docs/16: "trocar" abre a busca em modo picker; `pickedCnpj` é o
  // resultado escolhido, devolvido pelo App.
  onChangePlace?: () => void;
  pickedCnpj?: string | null;
}) {
  const t = useTheme();
  const [versao, setVersao] = useState<Versao>('v2');

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.versaoRow}>
        <VersaoChip
          label="avaliar v1"
          active={versao === 'v1'}
          onPress={() => setVersao('v1')}
          testID="avaliar-v1"
        />
        <VersaoChip
          label="avaliar v2"
          active={versao === 'v2'}
          onPress={() => setVersao('v2')}
          testID="avaliar-v2"
        />
      </View>

      {versao === 'v1' ? (
        <ComposeV1
          userId={userId}
          initialCnpj={initialCnpj}
          onCancel={onCancel}
          onPosted={onPosted}
        />
      ) : (
        <ComposeV2
          userId={userId}
          initialCnpj={initialCnpj}
          onCancel={onCancel}
          onPosted={onPosted}
          onChangePlace={onChangePlace}
          pickedCnpj={pickedCnpj}
        />
      )}
    </ScrollView>
  );
}

// ---- v1: layout original (busca + botões de nota 1-5) -------------------
function ComposeV1({
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
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(
    () => (selected ? [] : searchRestaurants(query)),
    [query, selected],
  );

  const canSend = selected !== null && rating !== null && !sending;

  const submit = async () => {
    if (!canSend || selected === null || rating === null) return;
    setSending(true);
    setError(null);
    try {
      await postReview(userId, {
        restaurantCnpj: selected.cnpj,
        rating,
        comment: comment.trim() === '' ? null : comment.trim(),
      });
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSending(false);
    }
  };

  return (
    <>
      <SectionTitle>restaurante</SectionTitle>
      {selected ? (
        <View style={[s.selected, { backgroundColor: t.quietBg }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.selectedNome, { color: t.ink }]}>{selected.nome}</Text>
            <Text style={[s.selectedCnpj, { color: t.sub }]}>{selected.cnpj}</Text>
          </View>
          <Pressable
            testID="limpar"
            onPress={() => setSelected(null)}
            hitSlop={8}
            style={s.clear}
            accessibilityRole="button"
            accessibilityLabel="trocar restaurante"
          >
            <Text style={{ color: t.sub, fontSize: 15 }}>×</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            testID="busca"
            value={query}
            onChangeText={setQuery}
            placeholder="buscar restaurante por nome…"
            placeholderTextColor={t.sub}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              s.input,
              { backgroundColor: t.quietBg, color: t.ink },
            ]}
            accessibilityLabel="buscar restaurante"
          />
          {results.map((r) => (
            <Pressable
              key={r.cnpj}
              testID={`pick-${r.cnpj}`}
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

      <SectionTitle>nota</SectionTitle>
      <View style={s.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = rating === n;
          return (
            <Pressable
              key={n}
              testID={`nota-${n}`}
              onPress={() => setRating(n)}
              style={[
                s.ratingBtn,
                { backgroundColor: t.quietBg },
                active && { backgroundColor: '#F2A93B' },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  s.ratingN,
                  { color: active ? '#241A22' : t.sub },
                ]}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
        <View style={s.preview}>
          <Text style={[s.previewN, { color: t.ink }]}>
            {rating != null ? getNote(rating) : '—'}
          </Text>
          <Text style={[s.previewL, { color: t.sub }]}>nota</Text>
        </View>
      </View>

      <SectionTitle>comentário (opcional)</SectionTitle>
      <TextInput
        testID="comentario"
        value={comment}
        onChangeText={setComment}
        placeholder="conta o que rolou…"
        placeholderTextColor={t.sub}
        multiline
        style={[s.input, s.commentInput, { backgroundColor: t.quietBg, color: t.ink }]}
        accessibilityLabel="comentário"
      />

      {error ? (
        <View testID="compose-erro" style={[s.error, { backgroundColor: t.quietBg }]}>
          <Text style={[s.errorText, { color: t.sub }]}>
            {friendlyApiError(error, 'publish')}
          </Text>
        </View>
      ) : null}

      <Pressable
        testID="publicar"
        onPress={() => void submit()}
        disabled={!canSend}
        style={[
          s.publish,
          { backgroundColor: '#E63E75', opacity: canSend ? 1 : 0.4 },
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSend, busy: sending }}
      >
        <Text style={s.publishText}>{sending ? 'publicando…' : 'publicar'}</Text>
      </Pressable>

      <Pressable
        testID="cancelar"
        onPress={onCancel}
        style={s.cancel}
        accessibilityRole="button"
      >
        <Text style={[s.cancelText, { color: t.sub }]}>cancelar</Text>
      </Pressable>
    </>
  );
}

function VersaoChip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[
        s.vchip,
        { backgroundColor: t.quietBg },
        active && { backgroundColor: t.chipActiveBg },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          s.vchipText,
          { color: active ? t.chipActiveInk : t.sub },
          active && s.vchipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  versaoRow: {
    flexDirection: 'row',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno,
  },
  vchip: {
    minHeight: 36,
    paddingHorizontal: spacing.padrao - 2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vchipText: { fontSize: 12.5, fontFamily: fonts.corpo500 },
  vchipTextActive: { fontWeight: '600' },
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
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: spacing.interno + 4,
  },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.interno,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
    borderRadius: 6,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.interno,
    minHeight: 44,
  },
  selectedNome: { fontFamily: fonts.corpo600, fontWeight: '600', fontSize: 14 },
  selectedCnpj: { fontSize: 12, marginTop: 1 },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno,
  },
  ratingBtn: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingN: { fontFamily: fonts.display800, fontSize: 17 },
  preview: { alignItems: 'center', marginLeft: spacing.interno },
  previewN: { fontFamily: fonts.display800, fontSize: 24 },
  previewL: { fontSize: 10.5 },
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
    color: '#FBF2E4',
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
