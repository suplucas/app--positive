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
import { ComposeScreen } from './src/ComposeScreen';
import { Navbar, type Screen } from './src/Navbar';
import { Podium } from './src/Podium';
import { ProfileScreen } from './src/ProfileScreen';
import { SectionTitle } from './src/SectionTitle';
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
import type { Review } from './src/types';

const USERS = ['user_1', 'user_2', 'mogli', 'dosso', 'lucas'] as const;

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
  const [themeOverride, setThemeOverride] = useState<Theme['mode'] | null>(null);
  const mode: Theme['mode'] =
    themeOverride ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  const toggleTheme = () => setThemeOverride(mode === 'dark' ? 'light' : 'dark');

  const [screen, setScreen] = useState<Screen>('feed');
  const [userId, setUserId] = useState<string>('user_1');
  const { items, status, error, hasMore, refresh, loadMore } = useFeed(userId);

  const onEndReached = useCallback(() => {
    if (status !== 'loading-more' && status !== 'loading') {
      void loadMore();
    }
  }, [status, loadMore]);

  // Primeiro review com nota >= 9 ganha o flair forte da tela.
  const strongId = useMemo(
    () => items.find((r) => r.rating != null && r.rating * 2 >= STRONG_NOTE)?.id ?? null,
    [items],
  );

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
          <View style={styles.headerRow}>
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
            <Pressable
              onPress={toggleTheme}
              hitSlop={7}
              style={[
                styles.themeBtn,
                { borderColor: theme.line },
              ]}
              accessibilityRole="button"
              accessibilityLabel={mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            >
              <Text style={{ fontSize: 14 }}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
            </Pressable>
          </View>

          {screen === 'feed' ? (
            <>
              <View style={styles.chips}>
                {USERS.map((u) => {
                  const active = u === userId;
                  return (
                    <Pressable
                      key={u}
                      onPress={() => setUserId(u)}
                      style={[
                        styles.chip,
                        { backgroundColor: theme.quietBg },
                        active && { backgroundColor: theme.chipActiveBg },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? theme.chipActiveInk : theme.sub },
                          active && styles.chipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {banner ? (
                <View style={[styles.banner, { backgroundColor: theme.quietBg }]}>
                  <Text style={[styles.bannerText, { color: theme.sub }]}>{banner}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </View>

        {screen === 'feed' ? (
          <FlatList<Review>
            data={items}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={
              <View>
                <Podium />
                <SectionTitle>reviews recentes</SectionTitle>
              </View>
            }
            renderItem={({ item }) => (
              <FeedCard review={item} strong={item.id === strongId} />
            )}
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
          <ProfileScreen />
        ) : (
          <ComposeScreen
            userId={userId}
            onCancel={() => setScreen('feed')}
            onPosted={() => {
              setScreen('feed');
              void refresh();
            }}
          />
        )}

        <Navbar
          active={screen}
          onNavigate={setScreen}
          onCompose={() => setScreen('compose')}
        />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  word: { fontFamily: fonts.display800, fontSize: 18 },
  themeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.interno },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.padrao,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontFamily: fonts.corpo500 },
  chipTextActive: { fontWeight: '600' },
  banner: {
    borderRadius: 5,
    paddingHorizontal: spacing.interno,
    paddingVertical: spacing.micro,
    alignSelf: 'flex-start',
  },
  bannerText: { fontSize: 12 },
});
