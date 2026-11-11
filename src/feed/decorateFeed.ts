import type { ImageSourcePropType } from 'react-native';
import { resolvePhotoUrl } from '../common/format';
import type { Review } from '../common/types';
import type { QuoteTone } from './FeedQuote';
import { photosFor } from './postPhotos';

// Formato de cada item do feed (spec D2): layout deriva da presença de
// foto — `photo` quando há `photoUrl` resolvida ou fotos de mock
// (`photoIndexes`/`photoIndex`); senão `quote`, com tom alternando
// mostarda → picles → lambeLambe por índice de quote. `row` nunca sai
// daqui (FeedCard segue nas telas de perfil/restaurante) e `strong` saiu
// (flair forte não renderiza no feed).
export type Decorated = {
  layout: 'photo' | 'quote';
  photos?: ImageSourcePropType[];
  tone?: QuoteTone;
};

const QUOTE_TONES: QuoteTone[] = ['mostarda', 'picles', 'lambeLambe'];

export function decorateFeed(items: Review[]): Map<Review['id'], Decorated> {
  const map = new Map<Review['id'], Decorated>();
  let quotes = 0;
  items.forEach((item, index) => {
    const remotePhoto = item.photoUrl
      ? { uri: resolvePhotoUrl(item.photoUrl) }
      : null;
    const hasMockPhotos =
      item.photoIndex != null ||
      (item.photoIndexes != null && item.photoIndexes.length > 0);
    const photos = remotePhoto
      ? [remotePhoto]
      : hasMockPhotos
        ? photosFor(item, index)
        : [];
    if (photos.length > 0) {
      map.set(item.id, { layout: 'photo', photos });
    } else {
      map.set(item.id, {
        layout: 'quote',
        tone: QUOTE_TONES[quotes % QUOTE_TONES.length]!,
      });
      quotes += 1;
    }
  });
  return map;
}
