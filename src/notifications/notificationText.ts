import type { AppNotification } from '../api/types';
import { restaurantName } from '../common/format';

// Segmentos de copy de uma notificação (spec 8.1/§9): `strong` renderiza
// com peso 600, `muted` com cor sub — quem decide a fonte do handle é o
// NotificationRow. Handles ficam `@handle` no texto.
export type Segment = { text: string; emphasis?: 'strong' | 'muted' };

// Nota da API (0-5) para a escala do produto (0-10), com vírgula: 2.25 → 4,5.
function notaPtBr(rating: number | null | undefined): string {
  if (rating == null) return '';
  return ((rating * 2).toFixed(1) as string).replace('.', ',');
}

export function notificationSegments(n: AppNotification): Segment[] {
  const handle = `@${n.actors[0]?.handle ?? n.actorId ?? 'alguém'}`;
  const nome = n.restaurant?.name ?? restaurantName(n.restaurantId);

  switch (n.type) {
    case 'like': {
      const mid =
        n.count > 1
          ? ` e mais ${n.count - 1} curtiram sua visita no `
          : ' curtiu sua visita no ';
      const segs: Segment[] = [
        { text: handle },
        { text: nome ? mid : mid.trimEnd() },
      ];
      if (nome) segs.push({ text: nome, emphasis: 'strong' });
      return segs;
    }
    case 'comment':
      return [
        { text: handle },
        { text: ' comentou: ' },
        { text: `"${n.previewText ?? ''}"`, emphasis: 'strong' },
      ];
    case 'follow':
      return [{ text: handle }, { text: ' começou a seguir você' }];
    case 'save': {
      const intro =
        n.count > 1 ? `${n.count} pessoas salvaram o ` : '1 pessoa salvou o ';
      const segs: Segment[] = [{ text: nome ? intro : intro.trimEnd() }];
      if (nome) segs.push({ text: nome, emphasis: 'strong' });
      segs.push({ text: ' no quero ir depois da sua visita' });
      return segs;
    }
    case 'network_visit': {
      const nota = notaPtBr(n.review?.rating);
      const segs: Segment[] = [
        { text: handle },
        { text: nome ? ' foi ao ' : ' foi ao' },
      ];
      if (nome) segs.push({ text: nome, emphasis: 'strong' });
      if (nota) {
        segs.push({ text: ', que está no seu quero ir, e deu ' });
        segs.push({ text: nota, emphasis: 'strong' });
      }
      return segs;
    }
    case 'milestone':
      return [
        { text: 'Tim!' },
        { text: ` Seu ${n.previewText ?? ''}.`, emphasis: 'strong' },
      ];
    default:
      return [{ text: n.type }];
  }
}
