import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
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
import { SettingsScreen, type ThemeMode } from './src/SettingsScreen';
import {
  ThemeContext,
  darkTheme,
  fonts,
  lightTheme,
  palette,
  spacing,
  type Theme,
} from './src/theme';
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

  const banner =
    status === 'loading' && items.length === 0
      ? 'Carregando feed…'
      : status === 'error'
        ? `Erro: ${error ?? 'desconhecido'}`
        : status === 'empty'
          ? 'Feed vazio para este usuário'
          : status === 'loading-more'
            ? 'Carregando mais…'
            : !hasMore && items.length > 0
              ? 'Fim do feed'
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
            ) : screen === 'perfil' ? (
              'perfil'
            ) : (
              'avaliar'
            )}
          </Text>
          {screen === 'feed' && banner ? (
            <View style={[styles.banner, { backgroundColor: theme.quietBg }]}>
              <Text style={[styles.bannerText, { color: theme.sub }]}>{banner}</Text>
            </View>
          ) : null}
        </View>

        {settingsOpen ? (
          <SettingsScreen
            userId={userId}
            onUserChange={(id) => setUserId(id)}
            themeMode={themeMode}
            onThemeChange={(m) => setThemeMode(m)}
            onBack={() => setSettingsOpen(false)}
          />
        ) : restaurantCnpj ? (
          <RestaurantScreen
            cnpj={restaurantCnpj}
            onBack={() => setRestaurantCnpj(null)}
            onEvaluate={() => {
              setComposeCnpj(restaurantCnpj);
              setRestaurantCnpj(null);
              setScreen('compose');
            }}
          />
        ) : screen === 'feed' ? (
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
              if (d?.layout === 'photo' && d.photo) {
                return <FeedPhoto review={item} photo={d.photo} onPress={openPlace} />;
              }
              if (d?.layout === 'quote') {
                return <FeedQuote review={item} tone={d.tone} onPress={openPlace} />;
              }
              return <FeedCard review={item} onPress={openPlace} />;
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
        ) : screen === 'perfil' ? (
          <ProfileScreen onSettings={() => setSettingsOpen(true)} />
        ) : (
          <ComposeScreen
            userId={userId}
            initialCnpj={composeCnpj}
            onCancel={() => setScreen('feed')}
            onPosted={() => {
              setComposeCnpj(null);
              setScreen('feed');
              void refresh();
            }}
          />
        )}

        {settingsOpen || restaurantCnpj ? null : (
          <Navbar
            active={screen}
            onNavigate={setScreen}
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
  },
  bannerText: { fontSize: 12 },
});
