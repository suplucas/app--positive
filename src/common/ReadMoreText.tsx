import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { fonts, palette } from './theme';

// “ler mais/ver menos” medido por layout (spec D18): o onTextLayout diz se
// o texto realmente truncou — sem chutar por contagem de caracteres.
export function ReadMoreText({
  text,
  numberOfLines = 2,
  style,
  linkColor,
  testID,
}: {
  text: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  linkColor?: string;
  testID?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  return (
    <>
      <Text
        style={style}
        numberOfLines={expanded ? undefined : numberOfLines}
        onTextLayout={(e) => {
          if (!expanded) {
            setTruncated(e.nativeEvent.lines.length > numberOfLines);
          }
        }}
      >
        {text}
      </Text>
      {truncated ? (
        <Pressable
          testID={testID ? `${testID}-toggle` : undefined}
          onPress={() => setExpanded((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <Text
            style={[s.link, linkColor ? { color: linkColor } : null]}
          >
            {expanded ? 'ver menos' : 'ler mais'}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  link: {
    fontFamily: fonts.corpo600,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    color: palette.lambeLambe,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});
