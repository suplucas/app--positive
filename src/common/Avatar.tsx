import type { ImageSourcePropType } from 'react-native';
import { Image, View } from 'react-native';
import { avatarColor } from './format';

// Avatar: foto mock quando houver; senão cor sólida derivada do userId
// (sem sombra/moldura).
export function Avatar({
  userId,
  size = 32,
  photo,
}: {
  userId: string;
  size?: number;
  photo?: ImageSourcePropType;
}) {
  const radius = size / 2;
  if (photo) {
    return (
      <Image
        source={photo}
        style={{ width: size, height: size, borderRadius: radius, flexShrink: 0 }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: avatarColor(userId),
        flexShrink: 0,
      }}
    />
  );
}
