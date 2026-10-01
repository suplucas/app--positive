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
import { FeedCard } from './src/FeedCard';
import { FeedPhoto } from './src/FeedPhoto';
import { FeedQuote } from './src/FeedQuote';
import { MOCK_USER } from './src/mockFeed';
import { MOCK_POST_PHOTOS, photoFor } from './src/postPhotos';
import { ComposeScreen } from './src/ComposeScreen';
import { Navbar, type Screen } from './src/Navbar';
import { Podium } from './src/Podium';
import { ProfileScreen } from './src/ProfileScreen';
import { RestaurantScreen } from './src/RestaurantScreen';
import { SectionTitle } from './src/SectionTitle';
import { NotificationScreen } from './src/NotificationScreen';
import { SavedScreen } from './src/SavedScreen';
import { SearchScreen } from './src/SearchScreen';
import { SettingsScreen, type ThemeMode } from './src/SettingsScreen';
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
import { friendlyApiError } from './src/format';
import { useFeed } from './src/useFeed';
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
  const [composeCnpj, setComposeCnpj] = useState<string | null>(null);
  // Variante de UI do feed (mesmo padrão do seletor de versão do perfil):
  // v2 é a UI de teste em que o card de foto leva a linha de texto p/
  // dentro da imagem (docs do audit).
  const [feedVersion, setFeedVersion] = useState<'v1' | 'v2'>('v1');
  // Lista "quero ir" (docs/10): fonte única de saves, compartilhada com
  // o toggle da página do restaurante.
  const [savedCnpjs, setSavedCnpjs] = useState<string[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  // Thread de comentários (docs/12): review aberta pelo 💬 de um card.
  const [commentReview, setCommentReview] = useState<Review | null>(null);
  const toggleSaved = (cnpj: string) =>
    setSavedCnpjs((prev) =>
      prev.includes(cnpj) ? prev.filter((c) => c !== cnpj) : [...prev, cnpj],
    );
  const feedVisible =
    screen === 'feed' && !restaurantCnpj && !settingsOpen;
  const { items, status, error, hasMore, refresh, loadMore } = useFeed(userId);

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
        photo?: ImageSourcePropType;
        tone?: 'mostarda' | 'lambeLambe';
      }
    >();
    let quotes = 0;
    items.forEach((item, index) => {
      const photo = photoFor(item, index);
      const strong = item.rating != null && item.rating * 2 >= STRONG_NOTE;
      const layout: ReviewLayout =
        item.layout ?? (photo ? 'photo' : strong ? 'quote' : 'row');
      if (layout === 'photo') {
        map.set(item.id, { layout, photo: photo ?? MOCK_POST_PHOTOS[0] });
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
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <View style={[styles.header, { borderBottomColor: theme.line }]}>
          <Text style={[styles.word, { color: theme.ink }]}>
            {screen === 'feed' ? (
              <>
                t
                <Text style={{ color: palette.lambeLambe }}>im</Text>
              </>
            ) : screen === 'busca' ? (
              'busca'
            ) : screen === 'notif' ? (
              'notifs'
            ) : screen === 'perfil' ? (
              'perfil'
            ) : (
              'avaliar'
            )}
          </Text>
          {feedVisible ? (
            <View style={styles.feedChips}>
              <FeedVersionChip
                label="feed v1"
                active={feedVersion === 'v1'}
                onPress={() => setFeedVersion('v1')}
                testID="feed-v1"
              />
              <FeedVersionChip
                label="feed v2 · teste"
                active={feedVersion === 'v2'}
                onPress={() => setFeedVersion('v2')}
                testID="feed-v2"
              />
            </View>
          ) : null}
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

        <View style={styles.content}>
          {screen === 'busca' ? (
            <SearchScreen onOpenRestaurant={(cnpj) => setRestaurantCnpj(cnpj)} />
          ) : screen === 'notif' ? (
            <NotificationScreen
              onOpenRestaurant={(cnpj) => setRestaurantCnpj(cnpj)}
            />
          ) : screen === 'perfil' ? (
            <ProfileScreen
              userId={userId}
              onSettings={() => setSettingsOpen(true)}
              savedCount={savedCnpjs.length}
              onSavedList={() => setSavedOpen(true)}
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
                    setRestaurantCnpj(String(item.restaurantCnpj));
                  }
                };
                const openComments = () => setCommentReview(item);
                if (d?.layout === 'photo' && d.photo) {
                  return (
                    <FeedPhoto
                      review={item}
                      photo={d.photo}
                      variant={feedVersion}
                      onPress={openPlace}
                      onComments={openComments}
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
                    />
                  );
                }
                return (
                  <FeedCard review={item} onPress={openPlace} onComments={openComments} />
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
                onBack={() => setRestaurantCnpj(null)}
                onEvaluate={() => {
                  setComposeCnpj(restaurantCnpj);
                  setScreen('compose');
                }}
                saved={savedCnpjs.includes(restaurantCnpj)}
                onSaveToggle={() => toggleSaved(restaurantCnpj)}
              />
            </LayerScreen>
          ) : null}
          {screen === 'compose' ? (
            <LayerScreen>
              <ComposeScreen
                userId={userId}
                initialCnpj={composeCnpj}
                onCancel={() => {
                  // Vem da página do restaurante? Ela continua viva lá embaixo.
                  setComposeCnpj(null);
                  setScreen('feed');
                }}
                onPosted={() => {
                  setComposeCnpj(null);
                  setScreen('feed');
                  void refresh();
                }}
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
          {savedOpen ? (
            <LayerScreen>
              <SavedScreen
                cnpjs={savedCnpjs}
                onRemove={(cnpj) =>
                  setSavedCnpjs((prev) => prev.filter((c) => c !== cnpj))
                }
                onOpenRestaurant={(cnpj) => {
                  // Fecha a lista e revela a página do restaurante.
                  setSavedOpen(false);
                  setRestaurantCnpj(cnpj);
                }}
                onBack={() => setSavedOpen(false)}
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
        </View>

        {settingsOpen || savedOpen || commentReview || screen === 'compose' || restaurantCnpj ? null : (
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
  word: { fontFamily: fonts.display800, fontSize: 18 },
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
  feedChips: {
    flexDirection: 'row',
    gap: spacing.interno,
    paddingRight: spacing.padrao,
  },
  feedChip: {
    minHeight: 36,
    paddingHorizontal: spacing.padrao - 2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedChipText: { fontSize: 12.5, fontFamily: fonts.corpo500 },
  feedChipTextActive: { fontWeight: '600' },
});

function FeedVersionChip({
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
        styles.feedChip,
        { backgroundColor: t.quietBg },
        active && { backgroundColor: t.chipActiveBg },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          styles.feedChipText,
          { color: active ? t.chipActiveInk : t.sub },
          active && styles.feedChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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
