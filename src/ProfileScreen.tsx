import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { NoteBadge } from './NoteBadge';
import { PERFIL } from './mockData';
import { SectionTitle } from './SectionTitle';
import { fonts, spacing, useTheme } from './theme';

// Perfil 100% mock (não existe endpoint de perfil ainda).
export function ProfileScreen() {
  const t = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={s.scroll}
    >
      <View style={s.bioBlock}>
        <Avatar userId={PERFIL.userId} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={[s.name, { color: t.ink }]}>{PERFIL.nome}</Text>
          <Text style={[s.handle, { color: t.sub }]}>{PERFIL.handle}</Text>
          <Text style={[s.bio, { color: t.ink }]}>{PERFIL.bio}</Text>
        </View>
      </View>

      <View style={[s.stats, { borderBottomColor: t.line }]}>
        {PERFIL.stats.map((st) => (
          <View key={st.l} style={s.stat}>
            <Text style={[s.statN, { color: t.ink }]}>{st.n}</Text>
            <Text style={[s.statL, { color: t.sub }]}>{st.l}</Text>
          </View>
        ))}
      </View>

      <SectionTitle>favoritos</SectionTitle>
      <View style={s.shelf}>
        {PERFIL.favoritos.map((f) => (
          <View key={f.nota} style={[s.sq, { backgroundColor: f.cor }]}>
            <NoteBadge note={f.nota} variant="chip" />
          </View>
        ))}
      </View>

      <SectionTitle>diário</SectionTitle>
      <View style={s.diary}>
        {chunk(PERFIL.diario, 4).map((row, i) => (
          <View key={i} style={s.diaryRow}>
            {row.map((cell) => (
              <View key={cell.nota + cell.cor} style={[s.cell, { backgroundColor: cell.cor }]}>
                <NoteBadge note={cell.nota} variant="chip" />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  bioBlock: {
    flexDirection: 'row',
    gap: spacing.padrao,
    alignItems: 'flex-start',
    paddingTop: spacing.secao,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.padrao,
  },
  name: { fontFamily: fonts.display800, fontSize: 19 },
  handle: { fontSize: 12.5, marginTop: 1 },
  bio: { fontSize: 13, marginTop: spacing.interno, lineHeight: 19 },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.padrao,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontFamily: fonts.display800, fontSize: 17 },
  statL: { fontSize: 11, marginTop: 1 },
  shelf: {
    flexDirection: 'row',
    gap: spacing.interno,
    paddingHorizontal: spacing.padrao,
    paddingBottom: spacing.micro,
  },
  sq: { flex: 1, aspectRatio: 1, borderRadius: 8 },
  diary: {
    paddingHorizontal: spacing.padrao,
    gap: spacing.micro,
  },
  diaryRow: { flexDirection: 'row', gap: spacing.micro },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 6 },
});
