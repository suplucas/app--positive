import type { ImageSourcePropType } from 'react-native';
import { resolvePhotoUrl } from '../common/format';
import type { Review, ReviewLayout } from '../common/types';
import type { QuoteTone } from './FeedQuote';
import { MOCK_POST_PHOTOS, photoFor, photosFor } from './postPhotos';

// Nota forte na escala 0-10: flair "chorei de tão bom" no máx. 1 por tela.
const STRONG_NOTE = 9;

// Formato de cada item do feed + tom das quote cards (alterna entre 3 cores).
// `layout` explícito vence (feeds mock); senão deriva: foto pela regra de índice,
// quote para nota >= 9, caso contrário linha compacta.
export type Decorated = {
  layout: ReviewLayout;
  photos?: ImageSourcePropType[];
  tone?: QuoteTone;
  strong: boolean;
};

export function decorateFeed(items: Review[]): Map<Review['id'], Decorated> {
  const map = new Map<Review['id'], Decorated>();
  let quotes = 0;
  let strongUsed = false;
  items.forEach((item, index) => {
    const remotePhoto = item.photoUrl
      ? { uri: resolvePhotoUrl(item.photoUrl) }
      : null;
    const isMock =
      item.layout != null ||
      item.photoIndex != null ||
      item.photoIndexes != null;
    const photo = remotePhoto ?? (isMock ? photoFor(item, index) : null);
    // Duas noções distintas de "forte": a nota alta deriva o layout
    // (quote quando não há foto); `strong` do flair é a nota alta ainda
    // não usada, no máx. 1 por tela.
    const highRating = item.rating != null && item.rating * 2 >= STRONG_NOTE;
    const layout: ReviewLayout =
      item.layout ?? (photo ? 'photo' : highRating ? 'quote' : 'row');
    const strong = highRating && !strongUsed;
    if (strong) strongUsed = true;
    if (layout === 'photo') {
      // Foto remota da API vence; senão, 2+ fotos do mock viram carrossel.
      const photos = remotePhoto ? [remotePhoto] : photosFor(item, index);
      map.set(item.id, {
        layout,
        photos: photos.length > 0 ? photos : [MOCK_POST_PHOTOS[0]],
        strong,
      });
    } else if (layout === 'quote') {
      const tones: QuoteTone[] = ['mostarda', 'lambeLambe', 'picles'];
      map.set(item.id, {
        layout,
        tone: tones[quotes % tones.length]!,
        strong,
      });
      quotes += 1;
    } else {
      map.set(item.id, { layout, strong });
    }
  });
  return map;
}
