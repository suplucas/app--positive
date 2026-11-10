import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../common/theme';

const W = 13;

function StarCell({ fill }: { fill: number }) {
  return (
    <View style={s.cell}>
      <Text style={s.base}>★</Text>
      <View style={[s.clip, { width: fill * W }]}>
        <Text style={s.filled}>★</Text>
      </View>
    </View>
  );
}

export function StarRating({
  rating,
  color,
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
    color: 'rgba(36,26,34,0.22)',
  },
  clip: {
    position: 'absolute',
    overflow: 'hidden',
    height: W + 2,
  },
  filled: {
    fontSize: W,
    lineHeight: W + 2,
    color: palette.mostarda,
  },
});
