import { useCallback, useRef, useState } from 'react';
import { nextTabBarState } from './tabBarState';

type ScrollEvent = { nativeEvent: { contentOffset: { y: number } } };

// Hook da tab bar (spec D15): guarda a última posição (ref, sem
// re-render) e o estado mini (state). onScroll é estável (useCallback)
// para poder ir direto no FlatList.
export function useTabBarMinimize(): {
  mini: boolean;
  onScroll: (e: ScrollEvent) => void;
} {
  const [mini, setMini] = useState(false);
  const last = useRef(0);
  const miniRef = useRef(false);

  const onScroll = useCallback((e: ScrollEvent) => {
    const y = e.nativeEvent.contentOffset.y;
    const next = nextTabBarState(y, last.current, miniRef.current);
    last.current = next.last;
    if (next.mini !== miniRef.current) {
      miniRef.current = next.mini;
      setMini(next.mini);
    }
  }, []);

  return { mini, onScroll };
}
