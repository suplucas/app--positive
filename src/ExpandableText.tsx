import { useState } from 'react';
import { Pressable, StyleSheet, Text, type TextStyle } from 'react-native';
import { fonts } from './theme';

// Texto de card com “continuar lendo”: mostra no máximo `lines` linhas
// e só oferece o toggle quando passa de `limit` caracteres (heurística
// determinística, testável). Não navega; o toque é isolado do card.
export function ExpandableText({
  id,
  text,
  style,
  color,
  lines = 4,
  limit = 180,
}: {
  id: string;
  text: string;
  style?: TextStyle | TextStyle[];
  color: string;
  lines?: number;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = text.length > limit;

  return (
    <>
      <Text style={style} numberOfLines={expanded ? undefined : lines}>
        {text}
      </Text>
      {canExpand ? (
        <Pressable
          testID={`expand-${id}`}
          onPress={() => setExpanded((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <Text style={[s.toggle, { color }]}>
            {expanded ? 'ver menos' : 'continuar lendo'}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  toggle: {
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    fontSize: 11.5,
    marginTop: 4,
  },
});
