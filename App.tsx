import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import { PostDetailScreen } from './src/feed/PostDetailScreen';
import { AuthFlow } from './src/auth/AuthFlow';
import { EditProfileScreen } from './src/profile/EditProfileScreen';
import { EmptyState } from './src/common/EmptyState';
import { ErrorBoundary } from './src/common/ErrorBoundary';
import { LayerScreen } from './src/common/LayerScreen';
import { SlideOver } from './src/common/SlideOver';
import { FeedCard } from './src/feed/FeedCard';
import { FeedPhoto } from './src/feed/FeedPhoto';
import { FeedQuote } from './src/feed/FeedQuote';
import { decorateFeed } from './src/feed/decorateFeed';
import { useTabBarMinimize } from './src/feed/useTabBarMinimize';
import { ComposeScreen } from './src/compose/ComposeScreen';
import { Navbar, type Screen } from './src/common/Navbar';
import { PageTitle } from './src/common/PageTitle';
import { ProfileScreen } from './src/profile/ProfileScreen';
import { RestaurantScreen } from './src/restaurant/RestaurantScreen';
import { MapScreen } from './src/map/MapScreen';
import { NotificationScreen } from './src/notifications/NotificationScreen';
import { useNotifications } from './src/notifications/useNotifications';
import { SearchScreen } from './src/map/SearchScreen';
import { SettingsScreen, type ThemeMode } from './src/settings/SettingsScreen';
import { UserProfileScreen } from './src/profile/UserProfileScreen';
import { getReview } from './src/api/api';
import type { AppNotification, PlaceHit } from './src/api/types';
import {
  ThemeContext,
  darkTheme,
  fonts,
  lightTheme,
  palette,
  spacing,
  type Theme,
} from './src/common/theme';
import { friendlyApiError, restaurantName } from './src/common/format';
import { useFeed } from './src/feed/useFeed';
import { useSaves } from './src/restaurant/useSaves';
import { useSession } from './src/auth/useSession';
import type { Review } from './src/common/types';

export default function App() {
  // Fontes da identidade na RAIZ (antes do login): sem isso o logo/título
  // da tela de entrar caem na fonte do sistema.
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });
  const session = useSession();

  if (!fontsLoaded || session.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>carregando…</Text>
      </View>
    );
  }

  if (session.status === 'signed-out' || !session.user) {
    return <AuthFlow signIn={session.signIn} signUp={session.signUp} />;
  }

  return <MainApp userId={session.user.id} onSignOut={session.signOut} />;
}

function MainApp({
  userId,
  onSignOut,
}: {
  userId: string;
  onSignOut: () => Promise<void>;
}) {
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Edição do próprio perfil (MVP) + versão p/ forçar refetch ao salvar.
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  // Sub-páginas: página do restaurante (aberta no toque em card de feed)
  // e local pré-selecionado na composição (botão "avaliar" do restaurante).
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [osmPlace, setOsmPlace] = useState<PlaceHit | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [composeCnpj, setComposeCnpj] = useState<string | null>(null);
  // Lista "quero ir" (docs/10): persistida na API e compartilhada com
  // o toggle da página do restaurante.
  const saves = useSaves(userId);
  const savedCnpjs = saves.ids;
  // Visita expandida (spec 8.4): review aberta pelo 💬 de um card, pela
  // busca ou por uma notificação.
  const [postReview, setPostReview] = useState<Review | null>(null);
  // Notificações (docs/09) saíram da navbar (o mock docs/16 pôs o mapa
  // no lugar): viram camada aberta pelo coração do header (D17).
  const [notifOpen, setNotifOpen] = useState(false);
  // Badge do coração some depois de abrir o painel nesta sessão (D17).
  const [notifSeen, setNotifSeen] = useState(false);
  // Erro pontual do feed (ex.: review de notificação 404, spec §10) —
  // sobrepõe o banner até um tentar de novo/refresh.
  const [feedError, setFeedError] = useState<string | null>(null);
  // Notificações no topo do App: alimenta o badge do coração.
  const notifs = useNotifications(userId);
  // Pill da tab bar encolhe ao descer o feed (D13).
  const { mini, onScroll } = useTabBarMinimize();
  // Busca em modo picker (docs/16): "trocar" da avaliação abre a busca
  // como camada; o resultado vira `composePickedCnpj`.
  const [composePickerOpen, setComposePickerOpen] = useState(false);
  const [composePickedCnpj, setComposePickedCnpj] = useState<string | null>(
    null,
  );
  const toggleSaved = (cnpj: string) => {
    void saves.toggle(
      cnpj,
      restaurantName(cnpj) ?? cnpj,
      savedCnpjs.includes(cnpj),
    );
  };
  const feedVisible = screen === 'feed' && !restaurantId && !settingsOpen;
  const { items, status, error, hasMore, refresh, loadMore, like } =
    useFeed(userId);

  const onEndReached = useCallback(() => {
    if (status !== 'loading-more' && status !== 'loading') {
      void loadMore();
    }
  }, [status, loadMore]);

  // Formato de cada item do feed + tom das quote cards: extraído para
  // src/feed/decorateFeed.ts (mesma lógica, testada).
  const decorated = useMemo(() => decorateFeed(items), [items]);

  // Só estados que pedem atenção; o feed vazio ganha um empty state
  // próprio (abaixo), não o banner. Paginação não aparece mais. Erro
  // pontual (ex.: 404 da review de uma notificação) sobrepõe (spec §10).
  const banner =
    feedError != null
      ? friendlyApiError(feedError, 'feed')
      : status === 'loading' && items.length === 0
        ? 'Carregando feed…'
        : status === 'error'
          ? friendlyApiError(error, 'feed')
          : null;

  // Coração do header (D17): abrir o painel esconde o badge na sessão.
  const openNotif = () => {
    setNotifSeen(true);
    setNotifOpen(true);
  };
  // Toggle de tema do header (D17): alterna light/dark (o seletor de 3
  // opções continua nas configurações).
  const toggleTheme = () => setThemeMode(mode === 'dark' ? 'light' : 'dark');

  // Abre a visita expandida pelo id (busca/notificações); 404 e cia.
  // ficam sem overlay e acendem o banner de erro do feed (spec §10).
  const openReviewById = async (reviewId: string | number) => {
    try {
      setPostReview(await getReview(reviewId));
    } catch (e) {
      setFeedError(e instanceof Error ? e.message : String(e));
    }
  };

  // Tap numa notificação (spec 6.5/8.5): marca como lida e navega por
  // tipo — review (like/comment/save/network_visit) abre a visita,
  // follow abre o perfil, milestone só marca.
  const handleNotifOpen = (item: AppNotification) => {
    notifs.markRead(item.ids);
    if (item.type === 'follow') {
      if (item.actorId) setProfileUserId(item.actorId);
      setNotifOpen(false);
      return;
    }
    if (item.type === 'milestone') return;
    if (item.reviewId == null) return;
    setNotifOpen(false);
    void openReviewById(item.reviewId);
  };

  return (
    <ThemeContext.Provider value={theme}>
      <ErrorBoundary>
        <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          {/* docs/16: a avaliação tem sub-cabeçalho próprio (cancelar /
            nova avaliação / tim!) — o wordmark do app não aparece nela. */}
          {screen === 'compose' ||
          screen === 'mapa' ||
          screen === 'perfil' ? null : (
            <View style={[styles.header, { borderBottomColor: theme.line }]}>
              <View style={styles.headerRow}>
                <View style={styles.headerWord}>
                  <PageTitle>
                    {screen === 'feed' ? (
                      <>
                        t<Text style={{ color: palette.lambeLambe }}>im</Text>
                      </>
                    ) : screen === 'busca' ? (
                      'busca'
                    ) : screen === 'perfil' ? (
                      'perfil'
                    ) : (
                      'avaliar'
                    )}
                  </PageTitle>
                </View>
                {feedVisible ? (
                  <>
                    <Pressable
                      testID="notificacoes-header"
                      onPress={openNotif}
                      style={styles.iconBtn}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={
                        notifs.unreadCount > 0
                          ? `notificações, ${notifs.unreadCount} novas`
                          : 'notificações'
                      }
                    >
                      <Text style={[styles.heart, { color: theme.ink }]}>
                        ♡
                      </Text>
                      {notifs.unreadCount > 0 && !notifSeen ? (
                        <View
                          testID="badge-notif"
                          style={[styles.badge, { borderColor: theme.bg }]}
                        />
                      ) : null}
                    </Pressable>
                    <Pressable
                      testID="tema-header"
                      onPress={toggleTheme}
                      style={[styles.themeBtn, { borderColor: theme.line }]}
                      accessibilityRole="button"
                      accessibilityLabel="trocar tema"
                    >
                      <Text style={styles.themeIcon}>
                        {mode === 'dark' ? '☀️' : '🌙'}
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
              {feedVisible && banner ? (
                <View
                  style={[styles.banner, { backgroundColor: theme.quietBg }]}
                >
                  <Text style={[styles.bannerText, { color: theme.sub }]}>
                    {banner}
                  </Text>
                  {status === 'error' || feedError != null ? (
                    <Pressable
                      onPress={() => {
                        setFeedError(null);
                        void refresh();
                      }}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel="tentar carregar o feed de novo"
                    >
                      <Text
                        style={[
                          styles.retryText,
                          { color: palette.lambeLambe },
                        ]}
                      >
                        tentar de novo
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
                  setRestaurantId(cnpj);
                }}
                onOpenReview={(reviewId) => {
                  setRestaurantId(null);
                  setOsmPlace(null);
                  // Visita expandida via GET /reviews/:id (spec 8.6).
                  void openReviewById(reviewId);
                }}
                onOpenProfile={(userId) => {
                  setProfileUserId(userId);
                }}
                onBack={() => setScreen('feed')}
              />
            ) : screen === 'mapa' ? (
              <MapScreen onOpenRestaurant={(cnpj) => setRestaurantId(cnpj)} />
            ) : screen === 'perfil' ? (
              <ProfileScreen
                key={profileVersion}
                userId={userId}
                onSettings={() => setSettingsOpen(true)}
                onNotifications={openNotif}
                savedCnpjs={savedCnpjs}
                savedItems={saves.items}
                onRemoveSaved={(cnpj) => {
                  void saves.toggle(cnpj, restaurantName(cnpj) ?? cnpj, true);
                }}
                onOpenRestaurant={(cnpj) => setRestaurantId(cnpj)}
                onEditProfile={() => setEditProfileOpen(true)}
              />
            ) : (
              <FlatList<Review>
                data={items}
                keyExtractor={(item) => String(item.id)}
                ListEmptyComponent={
                  status === 'empty' ? (
                    <EmptyState
                      emoji="🍽️"
                      testID="feed-vazio"
                      title="O feed tá quieto por aqui."
                      subtitle="Siga gente que come bem ou avalie um lugar pra começar."
                      actionLabel="avaliar um lugar"
                      onAction={() => {
                        setComposeCnpj(null);
                        setScreen('compose');
                      }}
                    />
                  ) : undefined
                }
                renderItem={({ item }) => {
                  const d = decorated.get(item.id);
                  const openPlace = () => {
                    if (item.restaurantId) {
                      setOsmPlace(null);
                      setRestaurantId(String(item.restaurantId));
                    }
                  };
                  const openComments = () => setPostReview(item);
                  // Salvar lugar (spec 8.6): cards do feed usam o mesmo
                  // useSaves da página do restaurante.
                  const ownerProps = {
                    saved:
                      item.restaurantId != null &&
                      savedCnpjs.includes(String(item.restaurantId)),
                    onSave: () => {
                      if (item.restaurantId != null) {
                        toggleSaved(String(item.restaurantId));
                      }
                    },
                  };
                  if (d?.layout === 'photo' && d.photos) {
                    return (
                      <FeedPhoto
                        review={item}
                        photos={d.photos}
                        onPress={openPlace}
                        onComments={openComments}
                        onLike={() => void like(item)}
                        onAuthorPress={() => setProfileUserId(item.userId)}
                        {...ownerProps}
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
                        onAuthorPress={() => setProfileUserId(item.userId)}
                        {...ownerProps}
                      />
                    );
                  }
                  return (
                    <FeedCard
                      review={item}
                      onPress={openPlace}
                      onComments={openComments}
                      onLike={() => void like(item)}
                      onAuthorPress={() => setProfileUserId(item.userId)}
                    />
                  );
                }}
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: 104 }}
                onEndReachedThreshold={0.4}
                onEndReached={onEndReached}
                refreshControl={
                  <RefreshControl
                    refreshing={status === 'loading'}
                    onRefresh={() => {
                      setFeedError(null);
                      void refresh();
                    }}
                  />
                }
              />
            )}

            {/* Sub-telas como camadas: o conteúdo principal fica montado
              (feed preserva o scroll) e cada camada anima a entrada. */}
            {profileUserId ? (
              <LayerScreen>
                <UserProfileScreen
                  userId={profileUserId}
                  viewerId={userId}
                  onBack={() => setProfileUserId(null)}
                  onOpenRestaurant={(id) => {
                    setProfileUserId(null);
                    setOsmPlace(null);
                    setRestaurantId(id);
                  }}
                />
              </LayerScreen>
            ) : null}
            {restaurantId ? (
              <LayerScreen>
                <RestaurantScreen
                  cnpj={restaurantId}
                  userId={userId}
                  osmPlace={osmPlace ?? undefined}
                  onBack={() => {
                    setOsmPlace(null);
                    setRestaurantId(null);
                  }}
                  onEvaluate={() => {
                    if (restaurantId.startsWith('osm:')) return;
                    setComposeCnpj(restaurantId);
                    setScreen('compose');
                  }}
                  saved={
                    !restaurantId.startsWith('osm:') &&
                    savedCnpjs.includes(restaurantId)
                  }
                  onSaveToggle={
                    restaurantId.startsWith('osm:')
                      ? undefined
                      : () => toggleSaved(restaurantId)
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
                  placesOnly
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
                  themeMode={themeMode}
                  onThemeChange={(m) => setThemeMode(m)}
                  onBack={() => setSettingsOpen(false)}
                  onSignOut={onSignOut}
                />
              </LayerScreen>
            ) : null}
            {editProfileOpen ? (
              <LayerScreen>
                <EditProfileScreen
                  userId={userId}
                  onBack={() => setEditProfileOpen(false)}
                  onSaved={() => {
                    setEditProfileOpen(false);
                    setProfileVersion((v) => v + 1);
                  }}
                />
              </LayerScreen>
            ) : null}
          </View>

          {/* Painéis deslizantes (D16): cobrem o header — cada tela traz
            o próprio (← visita / notificações), como as .view do POC. */}
          {postReview ? (
            <SlideOver
              visible
              onClose={() => setPostReview(null)}
              testID="slide-post"
            >
              <PostDetailScreen
                review={postReview}
                authorId={userId}
                onBack={() => setPostReview(null)}
              />
            </SlideOver>
          ) : null}
          {notifOpen ? (
            <SlideOver
              visible
              onClose={() => setNotifOpen(false)}
              testID="slide-notif"
            >
              <NotificationScreen
                userId={userId}
                onOpen={handleNotifOpen}
                onClose={() => setNotifOpen(false)}
              />
            </SlideOver>
          ) : null}

          {settingsOpen ||
          postReview ||
          notifOpen ||
          composePickerOpen ||
          editProfileOpen ||
          screen === 'compose' ||
          restaurantId ||
          profileUserId ? null : (
            <Navbar
              active={screen}
              mini={mini}
              onNavigate={(s) => {
                // Navegação pela navbar fecha sub-telas (ex.: restaurante).
                setRestaurantId(null);
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
  header: {
    paddingTop: spacing.padrao,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.interno,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.interno,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.micro },
  headerWord: { flex: 1 },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: { fontSize: 26 },
  badge: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.lambeLambe,
    borderWidth: 2,
  },
  themeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: { fontSize: 14 },
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
