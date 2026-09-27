import type { ImageSourcePropType } from "react-native";
import post1 from "../assets/posts/post1-pratocarne.jpg";
import post2 from "../assets/posts/post2.jpg";
import post3 from "../assets/posts/post3.jpg";
import post4 from "../assets/posts/post4.jpg";

// Fotos mock (assets/posts). O modelo de dados ainda não tem mídia: a
// tela distribui as imagens locais de forma determinística pelo índice
// do feed — uma foto a cada 2 posts, alternando as imagens disponíveis.
const PHOTOS: ImageSourcePropType[] = [post1, post2, post3, post4];

// Exporta as fotos para reuso (ex.: avatar mock do perfil).
export const MOCK_POST_PHOTOS: ImageSourcePropType[] = PHOTOS;
// Perfil: usa a 2ª foto como foto de exemplo.
export const MOCK_PROFILE_PHOTO: ImageSourcePropType = post2;

// Resolve a foto de um review: feeds mock podem fixar `photoIndex`
// (índice em assets/posts); caso contrário, aplica a regra por posição.
export function photoFor(
  review: { photoIndex?: number | null },
  index: number,
): ImageSourcePropType | null {
  const i = review.photoIndex;
  if (typeof i === "number") {
    return (
      PHOTOS[((i % PHOTOS.length) + PHOTOS.length) % PHOTOS.length] ?? null
    );
  }
  // feed real: 1 foto a cada 2 posts (índice par)
  if (index % 2 === 0) {
    return PHOTOS[0] ?? null;
  }
  return PHOTOS[1] ?? null;
}

// Foto por índice (para favoritos/células do perfil)
export function photoAt(index: number): ImageSourcePropType {
  return (
    PHOTOS[((index % PHOTOS.length) + PHOTOS.length) % PHOTOS.length] ?? post1
  );
}
