import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, spacing, useTheme } from './theme';

type Avatar = { letter: string; color: string };

type NotifRow = {
  id: string;
  unread?: boolean;
  group?: string;           // label de seção antes desta linha
  avatars: Avatar[];        // 1 ou 2 (stack)
  tag?: { icon: string; color: string };
  bell?: boolean;
  thumb?: string;           // cor do thumbnail à direita
  time: string;
  handle?: string;          // @handle em negrito
  body: string;             // texto principal
  place?: string;           // lugar em negrito dentro do body
  sub?: string;             // texto secundário cinza (ex.: lugares em comum)
  cta?: string;             // call to action em rosa
  venueVerified?: boolean;  // ✓ verde ao lado do nome
  follow?: 'back' | 'on';  // botão "seguir de volta" ou "seguindo"
  arrow?: boolean;          // seta › (pedidos pra seguir)
  arrowSub?: string;        // sub text abaixo (ex.: "@joao.come e mais 1")
};

const DATA: NotifRow[] = [
  {
    id: 'reqs',
    unread: true,
    avatars: [{ letter: 'J', color: '#7A9A3D' }, { letter: 'P', color: '#F2A93B' }],
    time: '',
    body: 'pedidos pra seguir',
    arrowSub: '@joao.come e mais 1',
    arrow: true,
  },
  {
    id: 'likes',
    unread: true,
    group: 'hoje',
    avatars: [{ letter: 'B', color: '#E63E75' }, { letter: 'C', color: '#7A9A3D' }],
    tag: { icon: '♥', color: palette.lambeLambe },
    thumb: '#C9773A',
    time: '· 2h',
    handle: '@bea_come_tudo',
    body: ' e mais 4 curtiram sua visita no ',
    place: 'Boteco da Ana',
  },
  {
    id: 'comment',
    unread: true,
    avatars: [{ letter: 'C', color: '#7A9A3D' }],
    tag: { icon: '💬', color: '#241A22' },
    thumb: '#C9773A',
    time: '· 3h',
    handle: '@caio.rango',
    body: ' comentou: "o pastel é o de queijo? preciso saber"',
  },
  {
    id: 'saves',
    unread: true,
    avatars: [{ letter: '3', color: '#F2A93B' }],
    tag: { icon: '🔖', color: palette.mostarda },
    thumb: '#E8C27A',
    time: '· 5h',
    body: '3 pessoas salvaram o ',
    place: 'Mocotó',
    sub: ' no quero ir depois da sua visita',
  },
  {
    id: 'wish-visit',
    unread: true,
    avatars: [{ letter: 'L', color: '#E63E75' }],
    tag: { icon: '🔖', color: palette.mostarda },
    thumb: '#B33A2E',
    time: '· 6h',
    handle: '@lu.janta',
    body: ' foi ao ',
    place: 'Tan Tan',
    sub: ', que está no seu quero ir, e deu 4,5',
  },
  {
    id: 'follower',
    group: 'esta semana',
    avatars: [{ letter: 'R', color: '#5B4A8A' }],
    tag: { icon: '+', color: palette.picles },
    time: '· 2d',
    handle: '@rafa.prato',
    body: ' começou a seguir você',
    follow: 'back',
  },
  {
    id: 'tagged',
    avatars: [{ letter: 'B', color: '#E63E75' }],
    tag: { icon: '@', color: palette.lambeLambe },
    thumb: '#D9A441',
    time: '· 3d',
    handle: '@bea_come_tudo',
    body: ' marcou você como acompanhante no ',
    place: 'Bar do Luiz',
    cta: 'dê sua nota também →',
  },
  {
    id: 'rec-person',
    avatars: [{ letter: 'M', color: '#F2A93B' }],
    tag: { icon: '✦', color: palette.picles },
    time: '· 4d',
    handle: '@mari.garfo',
    body: ' tem gosto parecido com o seu',
    sub: '· 8 lugares em comum',
  },
  {
    id: 'venue-reply',
    avatars: [{ letter: 'BA', color: '#7B3A1E' }],
    tag: { icon: '💬', color: '#241A22' },
    time: '· 5d',
    body: 'Boteco da Ana',
    venueVerified: true,
    sub: ' respondeu sua avaliação: "volta que a gente guarda a mesa."',
  },
  {
    id: 'rec-rest',
    avatars: [{ letter: 'L', color: '#E63E75' }, { letter: 'C', color: '#7A9A3D' }],
    tag: { icon: '✦', color: palette.picles },
    thumb: '#8DA85A',
    time: '· 6d',
    body: '3 pessoas que você segue salvaram o ',
    place: 'Cora',
    sub: ', em Pinheiros',
  },
  {
    id: 'milestone',
    group: 'antes',
    bell: true,
    avatars: [],
    time: '· 2 sem',
    body: 'Tim! Seu 50º registro. São 50 lugares desde março.',
  },
  {
    id: 'follower2',
    avatars: [{ letter: 'J', color: '#7A9A3D' }],
    tag: { icon: '+', color: palette.picles },
    time: '· 3 sem',
    handle: '@ju.bistro',
    body: ' começou a seguir você',
    follow: 'on',
  },
  {
    id: 'likes2',
    avatars: [{ letter: 'M', color: '#F2A93B' }, { letter: 'L', color: '#E63E75' }],
    tag: { icon: '♥', color: palette.lambeLambe },
    thumb: '#E8C27A',
    time: '· 3 sem',
    handle: '@mari.garfo',
    body: ' e mais 11 curtiram sua visita no ',
    place: 'Mocotó',
  },
];

export function NotificationsScreen() {
  const t = useTheme();
  const unreadBg = t.mode === 'dark'
    ? 'rgba(242,169,59,0.09)'
    : 'rgba(242,169,59,0.14)';
  const [read, setRead] = useState<Set<string>>(new Set());

  function markRead(id: string) {
    setRead(prev => new Set([...prev, id]));
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {DATA.map(row => (
        <NotifItem
          key={row.id}
          row={row}
          unreadBg={unreadBg}
          isRead={read.has(row.id)}
          onPress={() => markRead(row.id)}
          t={t}
        />
      ))}
      <Text style={[s.end, { color: t.sub }]}>isso é tudo dos últimos 30 dias</Text>
    </ScrollView>
  );
}

function NotifItem({ row, unreadBg, isRead, onPress, t }: {
  row: NotifRow;
  unreadBg: string;
  isRead: boolean;
  onPress: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  const showUnread = row.unread && !isRead;

  return (
    <>
      {row.group ? (
        <Text style={[s.group, { color: t.sub }]}>{row.group}</Text>
      ) : null}
      <Pressable
        style={[s.row, showUnread && { backgroundColor: unreadBg }]}
        onPress={onPress}
      >
        {/* Avatar */}
        <View style={s.avWrap}>
          {row.bell ? (
            <View style={[s.avCircle, { backgroundColor: palette.berinjela }]}>
              <Text style={{ fontSize: 20 }}>🔔</Text>
            </View>
          ) : row.avatars.length === 2 ? (
            <View style={s.avStack}>
              <View style={[s.avSmall, { backgroundColor: row.avatars[0].color, top: 0, left: 0 }]}>
                <Text style={s.avLetter}>{row.avatars[0].letter}</Text>
              </View>
              <View style={[s.avSmall, { backgroundColor: row.avatars[1].color, bottom: 0, right: 0 }]}>
                <Text style={s.avLetter}>{row.avatars[1].letter}</Text>
              </View>
              {row.tag ? (
                <View style={[s.tag, { backgroundColor: row.tag.color, borderColor: t.bg }]}>
                  <Text style={s.tagText}>{row.tag.icon}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[s.avCircle, { backgroundColor: row.avatars[0]?.color ?? '#ccc' }]}>
              <Text style={s.avLetterLg}>{row.avatars[0]?.letter}</Text>
              {row.tag ? (
                <View style={[s.tag, { backgroundColor: row.tag.color, borderColor: t.bg }]}>
                  <Text style={s.tagText}>{row.tag.icon}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Texto */}
        <View style={s.txtCol}>
          <Text style={[s.txt, { color: t.ink }]} numberOfLines={3}>
            {row.handle ? (
              <Text style={s.handle}>{row.handle}</Text>
            ) : null}
            {row.body ? row.body : null}
            {row.place ? (
              <Text style={{ fontFamily: fonts.display700 }}>{row.place}</Text>
            ) : null}
            {row.venueVerified ? (
              <Text style={{ color: palette.picles, fontSize: 11 }}> ✓</Text>
            ) : null}
            {row.sub ? (
              <Text style={{ color: t.sub }}>{row.sub}</Text>
            ) : null}
            {row.arrowSub ? (
              <Text style={{ color: t.sub }}>{'\n'}{row.arrowSub}</Text>
            ) : null}
            {row.time ? (
              <Text style={[s.time, { color: t.sub }]}> {row.time}</Text>
            ) : null}
          </Text>
          {row.cta ? (
            <Text style={[s.cta, { color: palette.lambeLambe }]}>{row.cta}</Text>
          ) : null}
        </View>

        {/* Lado direito: thumbnail, botão seguir, ou seta */}
        {row.thumb ? (
          <View style={[s.thumb, { backgroundColor: row.thumb }]} />
        ) : row.follow ? (
          <FollowButton initial={row.follow} t={t} />
        ) : row.arrow ? (
          <Text style={[s.arrow, { color: t.sub }]}>›</Text>
        ) : null}
      </Pressable>
    </>
  );
}

function FollowButton({ initial, t }: { initial: 'back' | 'on'; t: ReturnType<typeof useTheme> }) {
  const [on, setOn] = useState(initial === 'on');
  return (
    <Pressable
      onPress={() => setOn(v => !v)}
      style={[s.followBtn,
        { borderColor: t.ink },
        on
          ? { backgroundColor: 'transparent' }
          : { backgroundColor: t.ink }]}
    >
      <Text style={[s.followBtnText,
        { color: on ? t.ink : t.bg, opacity: on ? 0.7 : 1 }]}>
        {on ? 'seguindo' : 'seguir de volta'}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  group: {
    fontFamily: fonts.display700,
    fontSize: 13,
    paddingTop: 18,
    paddingBottom: 6,
    paddingHorizontal: spacing.padrao,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 10,
    minHeight: 64,
  },
  avWrap: { width: 44, height: 44, flexShrink: 0 },
  avCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avLetterLg: {
    color: '#fff', fontFamily: fonts.display800,
    fontSize: 16, lineHeight: 18,
  },
  avStack: { width: 44, height: 44, position: 'relative' },
  avSmall: {
    position: 'absolute',
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  avLetter: { color: '#fff', fontFamily: fonts.display800, fontSize: 12 },
  tag: {
    position: 'absolute', right: -3, bottom: -3,
    width: 19, height: 19, borderRadius: 9.5,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, zIndex: 2,
  },
  tagText: { fontSize: 9, color: '#fff', lineHeight: 10 },
  txtCol: { flex: 1, minWidth: 0 },
  txt: { fontSize: 13.5, lineHeight: 19, fontFamily: fonts.corpo },
  handle: { fontFamily: fonts.display700, fontSize: 13.5 },
  time: { fontSize: 12 },
  cta: {
    fontFamily: fonts.corpo600,
    fontSize: 12.5,
    marginTop: 2,
  },
  thumb: {
    width: 44, height: 44,
    borderRadius: 8, flexShrink: 0,
  },
  arrow: { fontSize: 22, paddingHorizontal: 4 },
  followBtn: {
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    flexShrink: 0,
  },
  followBtnText: { fontFamily: fonts.display700, fontSize: 12 },
  end: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.corpo,
    paddingVertical: 24,
    paddingHorizontal: spacing.padrao,
  },
});
