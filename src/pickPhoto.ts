import { launchImageLibraryAsync } from "expo-image-picker";
import type { ImageSourcePropType } from "react-native";

// Foto real do device (docs/13): galeria → URI local. A API não tem
// campo de foto ainda, então a imagem só existe na sessão de compose
// (POST /reviews continua cnpj + rating + comment — ver docs/05).
export async function pickPhoto(): Promise<ImageSourcePropType | null> {
  const res = await launchImageLibraryAsync({ quality: 0.8 });
  const asset = res.assets?.[0];
  // source em formato objeto ({uri}) — string crua saiu do tipo no RN
  // 0.86.
  return res.canceled || !asset ? null : { uri: asset.uri };
}
