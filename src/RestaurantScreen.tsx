import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PlaceHit } from './api/types';
import {
  RestaurantProfileTemplate,
  type RestaurantProfileData,
} from './RestaurantProfileTemplate';
import { restaurantFor, type RestaurantData } from './restaurantMock';
import { palette, spacing, useTheme } from './theme';
import { useRestaurant } from './useRestaurant';

const CAPAS = [palette.mostarda, palette.lambeLambe, palette.picles, '#8A3550'];

// Cor de capa determinística por CNPJ (a API não tem imagem de capa).
function coverFor(cnpj: string): string {
  let hash = 0;
  for (let i = 0; i < cnpj.length; i++) {
    hash = (hash * 31 + cnpj.charCodeAt(i)) >>> 0;
  }
  return CAPAS[hash % CAPAS.length]!;
}

// Container do perfil do restaurante. Sem `data` injetada, busca o
// perfil + reviews na API. O template de apresentação fica alheio à
// origem dos dados.
export function RestaurantScreen({
  cnpj,
  data: injected,
  osmPlace,
  userId,
  onBack,
  onEvaluate,
  saved = false,
  onSaveToggle,
}: {
  cnpj: string;
  data?: RestaurantData;
  // Resultado OSM vindo da busca (id "osm:<tipo>/<id>"): não há
  // endpoint de restaurante; o template usa o hit e zero reviews.
  osmPlace?: PlaceHit;
  userId?: string;
  onBack: () => void;
  onEvaluate: () => void;
  // "quero ir" é estado do App (lista salva, docs/10): o toggle só
  // avisa; quem decide é a lista.
  saved?: boolean;
  onSaveToggle?: () => void;
}) {
  const t = useTheme();
  const isOsm = cnpj.startsWith('osm:');
  const remote = useRestaurant(cnpj, userId, !injected && !isOsm);

  if (!injected && isOsm && !osmPlace) {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <Text style={[s.message, { color: t.ink }]}>
          Não encontrei os dados desse lugar no OpenStreetMap.
        </Text>
      </View>
    );
  }

  if (!injected && !isOsm && remote.status === 'loading') {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <Text style={[s.message, { color: t.sub }]}>carregando…</Text>
      </View>
    );
  }

  if (!injected && !isOsm && (remote.status === 'error' || !remote.data)) {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <Text style={[s.message, { color: t.ink }]}>
          Não consegui carregar o restaurante.
        </Text>
        <Pressable
          testID="restaurante-retry"
          onPress={() => void remote.refresh()}
          hitSlop={8}
          accessibilityRole="button"
          style={[s.retry, { backgroundColor: palette.lambeLambe }]}
        >
          <Text style={s.retryText}>tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  const data: RestaurantProfileData = injected
    ? injected
    : isOsm && osmPlace
      ? {
          cnpj,
          nome: osmPlace.nome,
          categoria: osmPlace.categoria,
          bairro: osmPlace.bairro ?? null,
          preco: null,
          distanciaKm: null,
          capa: coverFor(cnpj),
          notaMedia: osmPlace.nota ?? null,
          totalAvaliacoes: 0,
          queroIr: 0,
          flairs: [],
          seguemAvaliaram: [],
          reviews: [],
        }
      : {
          cnpj: remote.data!.id,
          nome: remote.data!.nome,
          categoria: remote.data!.categoria,
          bairro: remote.data!.bairro ?? remote.data!.municipio,
          preco: remote.data!.preco,
          distanciaKm: null,
          capa: coverFor(cnpj),
          notaMedia: remote.data!.notaMedia,
          totalAvaliacoes: remote.data!.totalAvaliacoes,
          queroIr: remote.data!.queroIr,
          flairs: remote.data!.flairs,
          seguemAvaliaram: remote.data!.seguemAvaliaram,
          reviews: remote.reviews,
        };

  return (
    <RestaurantProfileTemplate
      data={data}
      saved={saved}
      onBack={onBack}
      onEvaluate={onEvaluate}
      onSaveToggle={onSaveToggle}
    />
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.padrao,
    gap: spacing.interno,
  },
  message: { fontSize: 14, textAlign: 'center' },
  retry: {
    borderRadius: 14,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 10,
  },
  retryText: { color: palette.papel, fontSize: 13, fontWeight: '600' },
});
