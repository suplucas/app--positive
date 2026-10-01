import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, useTheme } from './theme';

// Slider de nota na escala 0.0–10.0 em passos de 0.5 (docs_04): scroll
// horizontal com 21 ticks, marca central rosa e valor grande. O valor é
// controlado pelo pai (ComposeV2); o toque num tick ou o fim do scroll
// disparam onChange com o meio-passo mais próximo.
export const TICK_W = 34;
const STEPS = 20; // 0.0 → 10.0

export function NoteSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const t = useTheme();
  const [pad, setPad] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const initRef = useRef(false);

  const clamp = (v: number) => Math.min(10, Math.max(0, Math.round(v * 2) / 2));

  const onMomentumEnd = (e: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const idx = Math.round((e.nativeEvent.contentOffset.x - pad) / TICK_W);
    onChange(clamp(idx * 0.5));
  };

  // Centraliza o tick do valor inicial na marca rosa: só dá pra rolar depois
  // que o padding (dependente do onLayout) for aplicado no conteúdo.
  useEffect(() => {
    if (pad === 0 || initRef.current) return;
    initRef.current = true;
    const x = pad + Math.round(clamp(value) * 2) * TICK_W;
    const timer = setTimeout(
      () => scroller.current?.scrollTo({ x, animated: false }),
      0,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pad]);

  return (
    <View>
      <Text testID="nota-valor" style={[s.value, { color: t.ink }]}>
        {value.toFixed(1)}
      </Text>
      <View
        onLayout={(e) => {
          // Medição única: padding que centraliza o 1º tick sob a marca rosa.
          setPad(Math.max(0, (e.nativeEvent.layout.width - TICK_W) / 2));
        }}
        style={s.wrap}
      >
        <View style={[s.mark, { backgroundColor: palette.lambeLambe }]} />
        <ScrollView
          ref={scroller}
          testID="nota-scroll"
          horizontal
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
        >
          <View
            testID="nota-track"
            style={[s.track, { paddingLeft: pad, paddingRight: pad }]}
          >
            {Array.from({ length: STEPS + 1 }, (_, i) => {
              const v = i * 0.5;
              const major = i % 2 === 0;
              return (
                <Pressable
                  key={i}
                  testID={`nota-tick-${v.toFixed(1)}`}
                  onPress={() => onChange(v)}
                  style={[s.tick, major && s.tickMajor]}
                  accessibilityRole="button"
                  accessibilityLabel={`nota ${v.toFixed(1)}`}
                >
                  <View style={s.numSlot}>
                    {major ? (
                      <Text style={[s.num, { color: t.ink }]}>{Math.round(v)}</Text>
                    ) : null}
                  </View>
                  <View
                    style={[s.line, major && s.lineMajor, { backgroundColor: t.ink }]}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// A marca rosa não muda entre temas; o resto segue o tema (useTheme).
const s = StyleSheet.create({
  value: {
    fontFamily: fonts.display800,
    fontSize: 40,
    lineHeight: 42,
    textAlign: 'center',
  },
  wrap: { position: 'relative', height: 52, marginTop: 10 },
  // trilha em LINHA (default do RN é column — sem isso os ticks empilham e
  // o scroll horizontal não tem largura p/ rolar).
  track: { flexDirection: 'row', height: 52, alignItems: 'flex-end' },
  mark: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    pointerEvents: 'none',
  },
  tick: {
    width: TICK_W,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tickMajor: { opacity: 0.9 },
  numSlot: { height: 14, alignItems: 'center', justifyContent: 'flex-end' },
  num: { fontFamily: fonts.display700, fontSize: 11 },
  line: { width: 2, height: 14, borderRadius: 1 },
  lineMajor: { width: 2.5, height: 22 },
});
