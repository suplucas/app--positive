import { launchImageLibraryAsync } from 'expo-image-picker';
import type { ImageSourcePropType } from 'react-native';

export async function pickPhoto(): Promise<ImageSourcePropType | null> {
  const res = await launchImageLibraryAsync({ quality: 0.8 });
  const asset = res.assets?.[0];
  return res.canceled || !asset ? null : { uri: asset.uri };
}
