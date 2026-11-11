// Estado da tab bar pill (spec §9 / D15): encolhe ao descer, volta ao
// subir ou ao chegar ao topo. Função pura — testável sem React; o hook
// (useTabBarMinimize) só guarda last/mini entre eventos.

export type TabBarState = { mini: boolean; last: number };

// Abaixo de 40px considera "topo" e reseta; deltas maiores que 6px numa
// direção decidem encolher/expandir (evita tremideira em scroll lento).
const TOP = 40;
const THRESHOLD = 6;

export function nextTabBarState(
  y: number,
  last: number,
  mini: boolean,
): TabBarState {
  if (y < TOP) return { mini: false, last: 0 };
  const delta = y - last;
  if (delta > THRESHOLD) return { mini: true, last: y };
  if (delta < -THRESHOLD) return { mini: false, last: y };
  return { mini, last: y };
}
