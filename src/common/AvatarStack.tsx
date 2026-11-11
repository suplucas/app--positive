import { Image, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { avatarColor } from './format';
import { fonts, palette, useTheme } from './theme';

type Person = {
  id: string;
  name?: string;
  handle?: string | null;
  photoUrl?: string | null;
};

// Stack de avatares do painel (spec 8.2/8.5): 1 pessoa = círculo 44;
// 2+ = dois círculos de 32 sobrepostos (o POC mostra 2). `tag` é o selo
// do tipo da notificação no canto inferior direito.
export function AvatarStack({
  people,
  tag,
}: {
  people: Person[];
  tag?: { color: string; icon: LucideIcon } | null;
}) {
  const shown = people.slice(0, 2);
  const TagIcon = tag?.icon;

  return (
    <View style={s.wrap}>
      {shown.length <= 1 ? (
        shown[0] ? (
          <Circle person={shown[0]} size={44} />
        ) : null
      ) : (
        <View style={s.stack}>
          {/* o de trás fica deslocado 12 e ganha borda 2px (t.bg) para
              separar do círculo da frente */}
          <View style={s.back}>
            <Circle person={shown[1]!} size={32} bordered />
          </View>
          <View style={s.front}>
            <Circle person={shown[0]!} size={32} />
          </View>
        </View>
      )}
      {tag && TagIcon ? (
        <View style={[s.tag, { backgroundColor: tag.color }]}>
          <TagIcon size={11} color={palette.papel} strokeWidth={2.2} />
        </View>
      ) : null}
    </View>
  );
}

function Circle({
  person,
  size,
  bordered = false,
}: {
  person: Person;
  size: number;
  bordered?: boolean;
}) {
  const t = useTheme();
  const radius = size / 2;
  const border = bordered ? { borderWidth: 2, borderColor: t.bg } : null;
  if (person.photoUrl) {
    return (
      <Image
        source={{ uri: person.photoUrl }}
        style={{ width: size, height: size, borderRadius: radius, ...border }}
        resizeMode="cover"
      />
    );
  }
  const initial = (person.handle || person.name || person.id || '?')
    .trim()
    .charAt(0)
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: avatarColor(person.id),
        alignItems: 'center',
        justifyContent: 'center',
        ...border,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.display700,
          fontSize: Math.round(size * 0.42),
          lineHeight: Math.round(size * 0.42),
          color: palette.papel,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: 44, height: 44 },
  stack: { width: 44, height: 32 },
  back: { position: 'absolute', left: 12, top: 0 },
  front: { position: 'absolute', left: 0, top: 0 },
  // selo 19px no canto inferior direito
  tag: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 19,
    height: 19,
    borderRadius: 19 / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
