import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FeedCard } from './src/FeedCard';
import { useFeed } from './src/useFeed';
import type { Review } from './src/types';

const USERS = ['user_1', 'user_2', 'mogli', 'dosso', 'lucas'] as const;

export default function App() {
  const [userId, setUserId] = useState<string>('user_1');
  const { items, status, error, hasMore, refresh, loadMore } = useFeed(userId);

  const onEndReached = useCallback(() => {
    if (status !== 'loading-more' && status !== 'loading') {
      void loadMore();
    }
  }, [status, loadMore]);

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
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed · x-user-id</Text>
        <View style={styles.row}>
          {USERS.map((u) => (
            <Pressable
              key={u}
              onPress={() => setUserId(u)}
              style={[styles.chip, u === userId && styles.chipActive]}
            >
              <Text style={u === userId ? styles.chipTextActive : styles.chipText}>
                {u}
              </Text>
            </Pressable>
          ))}
        </View>
        {banner ? <Text style={styles.banner}>{banner}</Text> : null}
      </View>

      <FlatList<Review>
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <FeedCard review={item} />}
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        refreshControl={
          <RefreshControl refreshing={status === 'loading'} onRefresh={() => void refresh()} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 12, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ccc' },
  title: { fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee' },
  chipActive: { backgroundColor: '#1d4ed8' },
  chipText: { color: '#111' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  banner: { color: '#555' },
});
