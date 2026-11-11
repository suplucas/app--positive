import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, Bookmark, Heart, MessageCircle, Plus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { AppNotification } from '../api/types';
import { AvatarStack } from '../common/AvatarStack';
import {
  avatarColor,
  formatRelativeLong,
  resolvePhotoUrl,
  restaurantName,
} from '../common/format';
import { fonts, palette, type, useTheme } from '../common/theme';
import { notificationSegments } from './notificationText';

// Selo do tipo no canto do AvatarStack (spec 8.5): Heart rosa /
// MessageCircle berinjela / Plus picles / Bookmark mostarda (save e
// network_visit). Milestone não usa selo — vira círculo berinjela com Bell.
const TAG_BY_TYPE: Record<string, { color: string; icon: LucideIcon }> = {
  like: { color: palette.lambeLambe, icon: Heart },
  comment: { color: palette.berinjela, icon: MessageCircle },
  follow: { color: palette.picles, icon: Plus },
  save: { color: palette.mostarda, icon: Bookmark },
  network_visit: { color: palette.mostarda, icon: Bookmark },
};

// Row do painel de notificações (spec 8.5): avatar + selo, copy em
// segmentos (handle display700, strong 600), tempo `· há 2h`, thumb 44
// (foto da review ou tile com inicial do restaurante) e botão seguir só
// no follow. Não-lida pinta o fundo com unreadBg.
export function NotificationRow({
  item,
  following,
  onOpen,
  onFollow,
}: {
  item: AppNotification;
  following: boolean;
  onOpen: (item: AppNotification) => void;
  onFollow: (actorId: string) => void;
}) {
  const t = useTheme();
  const tag = TAG_BY_TYPE[item.type] ?? null;
  const isMilestone = item.type === 'milestone';
  const nome = item.restaurant?.name ?? restaurantName(item.restaurantId);
  const photoUrl = item.review?.photoUrl ?? null;
  // milestone não tem thumb (POC); tile precisa de restaurante resolvido.
  const showThumb = !isMilestone && !!(photoUrl || nome);
  const segments = notificationSegments(item);
  const label = segments.map((s) => s.text).join('');

  const segStyle = (emphasis?: string, text?: string) => [
    emphasis === 'strong' && s.strong,
    emphasis === 'muted' && { color: t.sub },
    !emphasis && text?.startsWith('@') && s.handle,
  ];

  return (
    <Pressable
      testID={`notif-row-${item.id}`}
      onPress={() => onOpen(item)}
      style={({ pressed }) => [
        s.row,
        item.readAt == null && { backgroundColor: t.unreadBg },
        pressed && { opacity: 0.92 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isMilestone ? (
        <View style={s.milestoneCircle}>
          <Bell size={20} color={palette.papel} />
        </View>
      ) : (
        <AvatarStack people={item.actors} tag={tag} />
      )}

      <View style={s.txt}>
        <Text style={[s.base, { color: t.ink }]}>
          {segments.map((seg, i) => (
            <Text key={i} style={segStyle(seg.emphasis, seg.text)}>
              {seg.text}
            </Text>
          ))}
          <Text style={[s.time, { color: t.sub }]}>
            {` · ${formatRelativeLong(item.createdAt)}`}
          </Text>
        </Text>
      </View>

      {item.type === 'follow' ? (
        <Pressable
          testID={`notif-follow-${item.id}`}
          onPress={() =>
            onFollow(item.actorId ?? item.actors[0]?.id ?? '')
          }
          disabled={following}
          style={({ pressed }) => [
            s.followBtn,
            { backgroundColor: following ? 'transparent' : t.ink },
            following && s.followingBtn,
            pressed && !following && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="seguir de volta"
          accessibilityState={{ disabled: following }}
        >
          <Text style={[s.followTxt, { color: following ? t.ink : t.bg }]}>
            {following ? 'seguindo' : 'seguir de volta'}
          </Text>
        </Pressable>
      ) : null}

      {showThumb && photoUrl ? (
        <Image
          source={{ uri: resolvePhotoUrl(photoUrl) }}
          style={s.thumb}
          resizeMode="cover"
        />
      ) : showThumb && nome ? (
        <View
          style={[s.thumb, { backgroundColor: avatarColor(item.restaurantId ?? '') }]}
        >
          <Text style={s.tileInitial}>{nome.charAt(0).toUpperCase()}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  milestoneCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.berinjela,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txt: { flex: 1, minWidth: 0 },  base: {
    fontFamily: fonts.corpo,
    fontSize: 13.5,
    lineHeight: 19,
  },
  handle: { fontFamily: fonts.display700 },
  strong: { fontFamily: fonts.corpo600, fontWeight: '600' },
  time: { fontSize: 12 },
  followBtn: {
    borderRadius: 20,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  followingBtn: { opacity: 0.7 },
  followTxt: {
    fontFamily: fonts.display700,
    fontSize: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tileInitial: {
    fontFamily: fonts.display800,
    fontSize: 16,
    color: palette.papel,
  },
});
