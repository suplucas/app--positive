import { StyleSheet, Text, View } from 'react-native';
import type { Review } from './types';

export function FeedCard({ review }: { review: Review }) {
  return (
    <View style={styles.card} testID={`card-${review.id}`}>
      <Text style={styles.user}>{review.userId}</Text>
      <Text>
        {review.rating != null ? `★ ${review.rating}` : '—'}
        {review.restaurantCnpj ? ` · ${review.restaurantCnpj}` : ''}
      </Text>
      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
      <Text style={styles.date}>{review.createdAt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    gap: 4,
  },
  user: { fontWeight: '700' },
  comment: { color: '#333' },
  date: { color: '#888', fontSize: 12 },
});
