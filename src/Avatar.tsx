import { View } from 'react-native';
import { avatarColor } from './format';

// Avatar sólido na paleta — cor derivada do userId (sem sombra/moldura).
export function Avatar({ userId, size = 32 }: { userId: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColor(userId),
        flexShrink: 0,
      }}
    />
  );
}
