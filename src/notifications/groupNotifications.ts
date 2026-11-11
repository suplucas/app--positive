import type { AppNotification } from '../api/types';

// Grupos do painel de notificações (spec 8.4): `hoje` = mesmo dia civil do
// dispositivo; `esta semana` = mais novo que 7d; `antes` = todo o resto
// dentro da janela de 30d. Itens mais velhos que 30d são descartados
// (defensivo — a API já filtra na query).
export type NotificationGroupLabel = 'hoje' | 'esta semana' | 'antes';

export type NotificationGroup = {
  label: NotificationGroupLabel;
  items: AppNotification[];
};

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const WINDOW = 30 * DAY;
const ORDER: NotificationGroupLabel[] = ['hoje', 'esta semana', 'antes'];

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function groupNotifications(
  items: AppNotification[],
  now: number = Date.now(),
): NotificationGroup[] {
  const today = startOfDay(now);
  const buckets: Record<NotificationGroupLabel, AppNotification[]> = {
    hoje: [],
    'esta semana': [],
    antes: [],
  };
  for (const item of items) {
    const t = new Date(item.createdAt).getTime();
    if (Number.isNaN(t)) continue;
    const age = now - t;
    if (age > WINDOW) continue;
    if (startOfDay(t) === today) buckets.hoje.push(item);
    else if (age < WEEK) buckets['esta semana'].push(item);
    else buckets.antes.push(item);
  }
  return ORDER.filter((label) => buckets[label].length > 0).map((label) => ({
    label,
    items: buckets[label],
  }));
}
