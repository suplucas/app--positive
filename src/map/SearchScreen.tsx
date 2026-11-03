import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { searchGlobal, type SearchResult } from '../api/search';
import type { PlaceHit } from '../api/types';
import type { Review } from '../common/types';
import type { UserProfile } from '../api/types';
import { fonts, palette, spacing, useTheme } from '../common/theme';
import type { RestaurantHit } from '../common/format';

// Busca global: lugares (conteúdo), reviews e perfis em uma única tela.
// Quando `placesOnly` está ativo (modo picker da avaliação), busca só
// lugares locais e avisa via `onPick`.
export function SearchScreen({
  onOpenRestaurant,
  onOpenReview,
  onOpenProfile,
  onBack,
  placesOnly,
  onPick,
}: {
  onOpenRestaurant: (cnpj: string) => void;
  // Resultado review: abre o comment thread / perfil do autor.
  onOpenReview?: (reviewId: string | number) => void;
  // Resultado perfil: abre a página do usuário.
  onOpenProfile?: (userId: string) => void;
  onBack?: () => void;
  // Modo picker (fluxo "trocar" da avaliação): só resultados locais.
  placesOnly?: boolean;
  onPick?: (hit: RestaurantHit) => void;
}) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResult(null);
      setStatus('idle');
      return;
    }
    let active = true;
    setStatus('loading');
    const timer = setTimeout(() => {
      searchGlobal(q)
        .then((data) => {
          if (!active) return;
          // Modo picker: só lugares locais.
          if (placesOnly) {
            data.places = data.places.filter((h) => h.source === 'local');
            data.reviews = [];
            data.users = [];
          }
          setResult(data);
          setStatus('idle');
        })
        .catch(() => {
          if (!active) return;
          setResult(null);
          setStatus('error');
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, placesOnly]);

  const hasResults = result != null &&
    (result.places.length > 0 || result.reviews.length > 0 || result.users.length > 0);

  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
    >
      <View style={[s.header, { borderBottomColor: t.line }]}>
        {onBack ? (
          <Pressable
            testID="busca-voltar"
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="voltar"
          >
            <Text style={[s.back, { color: t.sub }]}>‹</Text>
          </Pressable>
        ) : null}
        <TextInput
          testID="busca-input"
          value={query}
          onChangeText={setQuery}
          placeholder={
            placesOnly
              ? "Escolha um restaurante…"
              : "Buscar restaurantes, avaliações, pessoas…"
          }
          placeholderTextColor={t.sub}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            s.input,
            { backgroundColor: t.bg, color: t.ink, borderColor: t.line },
          ]}
          accessibilityLabel="buscar"
        />
      </View>

      {query.trim().length < 2 ? (
        <Text style={[s.empty, { color: t.sub }]}>
          Digite ao menos 2 letras para buscar.
        </Text>
      ) : status === 'loading' ? (
        <Text style={[s.empty, { color: t.sub }]}>buscando…</Text>
      ) : status === 'error' ? (
        <View style={s.emptyWrap}>
          <Text style={[s.empty, { color: t.sub }]}>
            Não consegui buscar agora. Tente de novo.
          </Text>
          {onBack ? (
            <Pressable
              testID="busca-voltar-erro"
              onPress={onBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="voltar"
              style={[
                s.retry,
                { backgroundColor: palette.lambeLambe },
              ]}
            >
              <Text style={s.retryText}>voltar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : result == null ? (
        <Text testID="busca-vazio" style={[s.empty, { color: t.sub }]}>
          Não encontramos “{query}” por aqui. Tente outro nome.
        </Text>
      ) : (
        <>
          {result.places.length > 0 && (
            <>
              {!placesOnly && (
                <Text style={[s.sectionTitle, { color: t.sub }]}>Lugares</Text>
              )}
              {result.places.map((hit) => (
                <Pressable
                  key={hit.id}
                  testID={`busca-lugar-${hit.id}`}
                  onPress={() => {
                    if (placesOnly && onPick && hit.source === 'local') {
                      onPick({ cnpj: hit.id, nome: hit.nome });
                    } else {
                      onOpenRestaurant(hit.id);
                    }
                  }}
                  style={({ pressed }) => [
                    s.row,
                    { borderBottomColor: t.line },
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`abrir ${hit.nome}`}
                >
                  <View style={[s.thumb, { backgroundColor: palette.picles }]} />
                  <View style={s.rowBody}>
                    <Text style={[s.name, { color: t.ink }]} numberOfLines={1}>
                      {hit.nome}
                    </Text>
                    <Text style={[s.meta, { color: t.sub }]} numberOfLines={1}>
                      {[hit.categoria, hit.bairro ?? hit.endereco]
                        .filter(Boolean)
                        .join(' · ') + (hit.source === 'osm' ? ' · osm' : '')}
                    </Text>
                  </View>
                  {hit.nota != null ? (
                    <Text style={[s.note, { color: t.ink }]}>
                      {hit.nota.toFixed(1)}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </>
          )}

          {!placesOnly && result.reviews.length > 0 && (
            <>
              <Text style={[s.sectionTitle, { color: t.sub }]}>Avaliações</Text>
              {result.reviews.map((review) => (
                <Pressable
                  key={String(review.id)}
                  testID={`busca-review-${review.id}`}
                  onPress={() => onOpenReview?.(review.id)}
                  style={({ pressed }) => [
                    s.row,
                    { borderBottomColor: t.line },
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`abrir avaliação ${review.id}`}
                >
                  <View style={[s.thumb, { backgroundColor: palette.berinjela }]} />
                  <View style={s.rowBody}>
                    <Text style={[s.name, { color: t.ink }]} numberOfLines={1}>
                      {review.comment ?? 'sem comentário'}
                    </Text>
                    <Text style={[s.meta, { color: t.sub }]} numberOfLines={1}>
                      nota {review.rating != null ? (review.rating * 2).toFixed(1) : '—'}
                    </Text>
                  </View>
                  <Text style={[s.note, { color: t.ink }]}>{review.likes}</Text>
                </Pressable>
              ))}
            </>
          )}

          {!placesOnly && result.users.length > 0 && (
            <>
              <Text style={[s.sectionTitle, { color: t.sub }]}>Pessoas</Text>
              {result.users.map((user) => {
                const handle = `@${user.username ?? user.id}`;
                return (
                  <Pressable
                    key={user.id}
                    testID={`busca-pessoa-${user.id}`}
                    onPress={() => onOpenProfile?.(user.id)}
                    style={({ pressed }) => [
                      s.row,
                      { borderBottomColor: t.line },
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`abrir perfil ${user.name}`}
                  >
                    <View style={[s.thumb, { backgroundColor: palette.lambeLambe }]} />
                    <View style={s.rowBody}>
                      <Text style={[s.name, { color: t.ink }]} numberOfLines={1}>
                        {user.name}
                      </Text>
                      <Text style={[s.meta, { color: t.sub }]} numberOfLines={1}>
                        {handle}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}

          {!hasResults && (
            <Text testID="busca-vazio" style={[s.empty, { color: t.sub }]}>
              Não encontramos “{query}” por aqui. Tente outro nome.
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
    paddingBottom: spacing.interno,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { fontSize: 22, lineHeight: 24 },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.corpo,
    minHeight: 42,
  },
  sectionTitle: {
    fontFamily: fonts.display700,
    fontSize: 12,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.padrao,
    paddingBottom: spacing.interno,
    letterSpacing: 0.05,
  },
  empty: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.padrao,
    paddingTop: spacing.interno,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: spacing.interno,
    paddingHorizontal: spacing.bloco,
    paddingTop: spacing.bloco,
    paddingBottom: spacing.bloco,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  rowBody: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display700, fontSize: 14 },
  meta: { fontSize: 12, marginTop: 2 },
  note: { fontFamily: fonts.display800, fontSize: 14, flexShrink: 0 },
  retry: {
    borderRadius: 14,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 10,
  },
  retryText: { color: palette.papel, fontSize: 13, fontWeight: '600' },
});
