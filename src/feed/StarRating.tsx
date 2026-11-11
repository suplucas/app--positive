import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../common/theme';

const W = 13;

// Estrela vazia = mesma cor com alpha 30% (hex 4D); cheia = cor cheia.
function StarCell({
  fill,
  color,
}: {
  fill: number;
  color: string;
}) {
  return (
    <View style={s.cell}>
      <Text style={[s.base, { color: `${color}4D` }]}>★</Text>
      <View style={[s.clip, { width: fill * W }]}>
        <Text style={[s.filled, { color }]}>★</Text>
      </View>
    </View>
  );
}

export function StarRating({
  rating,
  color = palette.mostarda,
}: {
  rating: number | null;
  color?: string;
}) {
  if (rating == null) return null;
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((k) => (
        <StarCell
          key={k}
          fill={Math.max(0, Math.min(1, rating - k + 1))}
          color={color}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1, alignItems: 'center' },
  cell: { width: W, height: W },
  base: {
    position: 'absolute',
    fontSize: W,
    lineHeight: W + 2,
  },
  clip: {
    position: 'absolute',
    overflow: 'hidden',
    height: W + 2,
  },
  filled: {
    fontSize: W,
    lineHeight: W + 2,
  },
});
