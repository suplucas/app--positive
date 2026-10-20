import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { CommentThreadScreen } from './src/CommentThreadScreen';
import { ErrorBoundary } from './src/ErrorBoundary';
import { FeedCard } from './src/FeedCard';
import { FeedPhoto } from './src/FeedPhoto';
import { FeedQuote } from './src/FeedQuote';
import { MOCK_USER } from './src/mockFeed';
import { MOCK_POST_PHOTOS, photoFor, photosFor } from './src/postPhotos';
import { ComposeScreen } from './src/ComposeScreen';
import { Navbar, type Screen } from './src/Navbar';
import { PageTitle } from './src/PageTitle';
import { Podium } from './src/Podium';
import { ProfileScreen } from './src/ProfileScreen';
import { RestaurantScreen } from './src/RestaurantScreen';
import { SectionTitle } from './src/SectionTitle';
import { MapScreen } from './src/MapScreen';
import { NotificationScreen } from './src/NotificationScreen';
import { SearchScreen } from './src/SearchScreen';
import { SettingsScreen, type ThemeMode } from './src/SettingsScreen';
import type { PlaceHit } from './src/api/types';
import {
  ThemeContext,
  darkTheme,
  fonts,
  lightTheme,
  palette,
  spacing,
  useTheme,
  type Theme,
} from './src/theme';
import { friendlyApiError, resolvePhotoUrl, restaurantName } from './src/format';
import { useFeed } from './src/useFeed';
import { useSaves } from './src/useSaves';
import type { Review, ReviewLayout } from './src/types';
import type { ImageSourcePropType } from 'react-native';

// Nota forte na escala 0-10: flair "chorei de tão bom" no máx. 1 por tela.
const STRONG_NOTE = 9;

export default function App() {
  useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });

  const systemScheme = useColorScheme();
  // Escolha do usuário na tela de configurações: null = seguir o sistema.
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const mode: Theme['mode'] =
    themeMode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeMode;
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  const [screen, setScreen] = useState<Screen>('feed');
  const [userId, setUserId] = useState<string>('user_1');
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Sub-páginas: página do restaurante (aberta no toque em card de feed)
  // e local pré-selecionado na composição (botão "avaliar" do restaurante).
  const [restaurantCnpj, setRestaurantCnpj] = useState<string | null>(null);
  const [osmPlace, setOsmPlace] = useState<PlaceHit | null>(null);
  const [composeCnpj, setComposeCnpj] = useState<string | null>(null);
  // Lista "quero ir" (docs/10): persistida na API e compartilhada com
  // o toggle da página do restaurante.
  const saves = useSaves(userId);
  const savedCnpjs = saves.ids;
  // Thread de comentários (docs/12): review aberta pelo 💬 de um card.
  const [commentReview, setCommentReview] = useState<Review | null>(null);
  // Notificações (docs/09) saíram da navbar (o mock docs/16 pôs o mapa
  // no lugar): viram camada aberta pelo sino no perfil.
  const [notifOpen, setNotifOpen] = useState(false);
  // Busca em modo picker (docs/16): "trocar" da avaliação abre a busca
  // como camada; o resultado vira `composePickedCnpj`.
  const [composePickerOpen, setComposePickerOpen] = useState(false);
  const [composePickedCnpj, setComposePickedCnpj] = useState<string | null>(null);
  const toggleSaved = (cnpj: string) => {
    void saves.toggle(
      cnpj,
      restaurantName(cnpj) ?? cnpj,
      savedCnpjs.includes(cnpj),
    );
  };
  const feedVisible =
    screen === 'feed' && !restaurantCnpj && !settingsOpen;
  const { items, status, error, hasMore, refresh, loadMore, like } =
    useFeed(userId);

  const onEndReached = useCallback(() => {
    if (status !== 'loading-more' && status !== 'loading') {
      void loadMore();
    }
  }, [status, loadMore]);

  // Formato de cada item do feed + tom das quote cards (alterna
  // mostarda/lambe-lambe). `layout` explícito vence (feeds mock);
  // senão deriva: foto pela regra de índice, quote para nota >= 9,
  // caso contrário linha compacta.
  const decorated = useMemo(() => {
    const map = new Map<
      Review['id'],
      {
        layout: ReviewLayout;
        photos?: ImageSourcePropType[];
        tone?: 'mostarda' | 'lambeLambe';
      }
    >();
    let quotes = 0;
    items.forEach((item, index) => {
      const remotePhoto = item.photoUrl
        ? { uri: resolvePhotoUrl(item.photoUrl) }
        : null;
      const photo = remotePhoto ?? photoFor(item, index);
      const strong = item.rating != null && item.rating * 2 >= STRONG_NOTE;
      const layout: ReviewLayout =
        item.layout ?? (photo ? 'photo' : strong ? 'quote' : 'row');
      if (layout === 'photo') {
        // Foto remota da API vence; senão, 2+ fotos do mock viram carrossel.
        const photos = remotePhoto ? [remotePhoto] : photosFor(item, index);
        map.set(item.id, {
          layout,
          photos: photos.length > 0 ? photos : [MOCK_POST_PHOTOS[0]],
        });
      } else if (layout === 'quote') {
        map.set(item.id, {
          layout,
          tone: quotes % 2 === 0 ? 'mostarda' : 'lambeLambe',
        });
        quotes += 1;
      } else {
        map.set(item.id, { layout });
      }
    });
    return map;
  }, [items]);

  // Só estados que pedem atenção; paginação (fim de feed / carregando
  // mais) não aparece mais — o próprio fim da lista comunica.
  const banner =
    status === 'loading' && items.length === 0
      ? 'Carregando feed…'
      : status === 'error'
        ? friendlyApiError(error, 'feed')
        : status === 'empty'
          ? 'Feed vazio para este usuário'
          : null;

  return (
    <ThemeContext.Provider value={theme}>
      <ErrorBoundary>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        {/* docs/16: a avaliação tem sub-cabeçalho próprio (cancelar /
            nova avaliação / tim!) — o wordmark do app não aparece nela. */}
        {screen === 'compose' ? null : (
        <View style={[styles.header, { borderBottomColor: theme.line }]}>
          <PageTitle>
            {screen === 'feed' ? (
              <>
                t
                <Text style={{ color: palette.lambeLambe }}>im</Text>
              </>
            ) : screen === 'busca' ? (
              'busca'
            ) : screen === 'mapa' ? (
              'mapa'
            ) : screen === 'perfil' ? (
              'perfil'
            ) : (
              'avaliar'
            )}
          </PageTitle>
          {feedVisible && banner ? (
            <View
              style={[styles.banner, { backgroundColor: theme.quietBg }]}
            >
              <Text style={[styles.bannerText, { color: theme.sub }]}>
                {banner}
              </Text>
              {status === 'error' ? (
                <Pressable
                  onPress={() => void refresh()}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="tentar carregar o feed de novo"
                >
                  <Text style={[styles.retryText, { color: palette.lambeLambe }]}>
                    · tentar de novo
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
        )}

        <View style={styles.content}>
          {screen === 'busca' ? (
            <SearchScreen
              onOpenRestaurant={(cnpj) => {
                setOsmPlace(null);
                setRestaurantCnpj(cnpj);
              }}
              onOpenPlace={(hit) => {
                setOsmPlace(hit);
                setRestaurantCnpj(hit.id);
              }}
              onBack={() => setScreen('feed')}
            />
          ) : screen === 'mapa' ? (
            <MapScreen onOpenRestaurant={(cnpj) => setRestaurantCnpj(cnpj)} />
          ) : screen === 'perfil' ? (
            <ProfileScreen
              userId={userId}
              onSettings={() => setSettingsOpen(true)}
              onNotifications={() => setNotifOpen(true)}
              savedCnpjs={savedCnpjs}
              savedItems={saves.items}
              onRemoveSaved={(cnpj) => {
                void saves.toggle(
                  cnpj,
                  restaurantName(cnpj) ?? cnpj,
                  true,
                );
              }}
              onOpenRestaurant={(cnpj) => setRestaurantCnpj(cnpj)}
            />
          ) : (
            <FlatList<Review>
              data={items}
              keyExtractor={(item) => String(item.id)}
              ListHeaderComponent={
                <View>
                  {/* <Podium /> */}
                  <SectionTitle>reviews recentes</SectionTitle>
                </View>
              }
              renderItem={({ item }) => {
                const d = decorated.get(item.id);
                const openPlace = () => {
                  if (item.restaurantCnpj) {
                    setOsmPlace(null);
                    setRestaurantCnpj(String(item.restaurantCnpj));
                  }
                };
                const openComments = () => setCommentReview(item);
                if (d?.layout === 'photo' && d.photos) {
                  return (
                    <FeedPhoto
                      review={item}
                      photos={d.photos}
                      onPress={openPlace}
                      onComments={openComments}
                      onLike={() => void like(item)}
                    />
                  );
                }
                if (d?.layout === 'quote') {
                  return (
                    <FeedQuote
                      review={item}
                      tone={d.tone}
                      onPress={openPlace}
                      onComments={openComments}
                      onLike={() => void like(item)}
                    />
                  );
                }
                return (
                  <FeedCard review={item} onPress={openPlace} onComments={openComments} onLike={() => void like(item)} />
                );
              }}
              onEndReachedThreshold={0.4}
              onEndReached={onEndReached}
              refreshControl={
                <RefreshControl
                  refreshing={status === 'loading'}
                  onRefresh={() => void refresh()}
                />
              }
            />
          )}

          {/* Sub-telas como camadas: o conteúdo principal fica montado
              (feed preserva o scroll) e cada camada anima a entrada. */}
          {restaurantCnpj ? (
            <LayerScreen>
              <RestaurantScreen
                cnpj={restaurantCnpj}
                userId={userId}
                osmPlace={osmPlace ?? undefined}
                onBack={() => {
                  setOsmPlace(null);
                  setRestaurantCnpj(null);
                }}
                onEvaluate={() => {
                  if (restaurantCnpj.startsWith('osm:')) return;
                  setComposeCnpj(restaurantCnpj);
                  setScreen('compose');
                }}
                saved={
                  !restaurantCnpj.startsWith('osm:') &&
                  savedCnpjs.includes(restaurantCnpj)
                }
                onSaveToggle={
                  restaurantCnpj.startsWith('osm:')
                    ? undefined
                    : () => toggleSaved(restaurantCnpj)
                }
              />
            </LayerScreen>
          ) : null}
          {screen === 'compose' ? (
            <LayerScreen>
              <ComposeScreen
                userId={userId}
                initialCnpj={composeCnpj}
                onChangePlace={() => setComposePickerOpen(true)}
                pickedCnpj={composePickedCnpj}
                onCancel={() => {
                  // Vem da página do restaurante? Ela continua viva lá embaixo.
                  setComposeCnpj(null);
                  setComposePickedCnpj(null);
                  setComposePickerOpen(false);
                  setScreen('feed');
                }}
                onPosted={() => {
                  setComposeCnpj(null);
                  setComposePickedCnpj(null);
                  setComposePickerOpen(false);
                  setScreen('feed');
                  void refresh();
                }}
              />
            </LayerScreen>
          ) : null}
          {/* Busca em modo picker, por cima da avaliação (docs/16). */}
          {composePickerOpen ? (
            <LayerScreen>
              <SearchScreen
                onOpenRestaurant={() => {}}
                onPick={(hit) => {
                  setComposePickedCnpj(hit.cnpj);
                  setComposePickerOpen(false);
                }}
                onBack={() => setComposePickerOpen(false)}
              />
            </LayerScreen>
          ) : null}
          {settingsOpen ? (
            <LayerScreen>
              <SettingsScreen
                userId={userId}
                onUserChange={(id) => setUserId(id)}
                themeMode={themeMode}
                onThemeChange={(m) => setThemeMode(m)}
                onBack={() => setSettingsOpen(false)}
              />
            </LayerScreen>
          ) : null}
          {commentReview ? (
            <LayerScreen>
              <CommentThreadScreen
                review={commentReview}
                authorId={userId}
                onBack={() => setCommentReview(null)}
              />
            </LayerScreen>
          ) : null}
          {notifOpen ? (
            <LayerScreen>
              <NotificationScreen
                onOpenRestaurant={(cnpj) => {
                  setNotifOpen(false);
                  setRestaurantCnpj(cnpj);
                }}
                onBack={() => setNotifOpen(false)}
              />
            </LayerScreen>
          ) : null}
        </View>

        {settingsOpen || commentReview || notifOpen || composePickerOpen || screen === 'compose' || restaurantCnpj ? null : (
          <Navbar
            active={screen}
            onNavigate={(s) => {
              // Navegação pela navbar fecha sub-telas (ex.: restaurante).
              setRestaurantCnpj(null);
              setScreen(s);
            }}
            onCompose={() => {
              setComposeCnpj(null);
              setScreen('compose');
            }}
          />
        )}
      </SafeAreaView>
      </ErrorBoundary>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingTop: spacing.padrao,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.interno,
  },
  banner: {
    borderRadius: 5,
    paddingHorizontal: spacing.interno,
    paddingVertical: spacing.micro,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: { fontSize: 12 },
  retryText: { fontSize: 12, fontFamily: fonts.corpo600, fontWeight: '600' },
});

// Camada de sub-tela: absoluto sobre o conteúdo principal, com fade +
// slide de 180ms na entrada (useNativeDriver). A saída é instantânea —
// a camada unmounta e revela o que estava embaixo.
function LayerScreen({ children }: { children: ReactNode }) {
  const t = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [anim]);
  return (
    <Animated.View
      style={[
        styles.layer,
        {
          backgroundColor: t.bg,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
