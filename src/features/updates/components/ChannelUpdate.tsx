import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChannelUpdate as ChannelUpdateModel } from '../types/updates.types';
import { formatUpdateTime } from '../utils/updatesUtils';
import type { ThemeColors } from '../../../utils/colors';
import UpdateReaction from './UpdateReaction';

type ChannelUpdateProps = {
  colors: ThemeColors;
  update: ChannelUpdateModel;
  onCopy: () => void;
  onForward: () => void;
  onReact: (emoji: string) => void;
  onReport: () => void;
};

export default function ChannelUpdate({ colors, onCopy, onForward, onReact, onReport, update }: ChannelUpdateProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <Text style={styles.text}>{update.text}</Text>
      {(update.kind === 'image' || update.kind === 'video') && (
        <View style={styles.media}>
          <Ionicons name={update.kind === 'video' ? 'play-circle' : 'image-outline'} size={36} color={colors.textMuted} />
          <Text numberOfLines={1} style={styles.mediaText}>{update.kind === 'video' ? 'Video update' : 'Image update'}</Text>
        </View>
      )}
      {update.linkPreview && (
        <View style={styles.linkPreview}>
          <Text numberOfLines={1} style={styles.linkTitle}>{update.linkPreview.title}</Text>
          <Text numberOfLines={2} style={styles.linkDescription}>{update.linkPreview.description}</Text>
          <Text numberOfLines={1} style={styles.linkUrl}>{update.linkPreview.url}</Text>
        </View>
      )}
      <View style={styles.reactionCounts}>
        {update.reactions.map((reaction) => (
          <Text key={reaction.emoji} style={styles.reactionCount}>{reaction.emoji} {reaction.count}</Text>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.time}>{formatUpdateTime(update.createdAt)}</Text>
        <UpdateReaction colors={colors} onReact={onReact} />
        <Pressable onPress={onForward} style={styles.iconButton}><Ionicons name="arrow-redo-outline" size={19} color={colors.icon} /></Pressable>
        <Pressable onPress={onCopy} style={styles.iconButton}><Ionicons name="copy-outline" size={18} color={colors.icon} /></Pressable>
        <Pressable onPress={onReport} style={styles.iconButton}><Ionicons name="flag-outline" size={18} color={colors.danger} /></Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    footer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    iconButton: {
      alignItems: 'center',
      height: 34,
      justifyContent: 'center',
      width: 30,
    },
    linkDescription: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 3,
    },
    linkPreview: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginTop: 10,
      padding: 10,
    },
    linkTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    linkUrl: {
      color: colors.primary,
      fontSize: 12,
      marginTop: 4,
    },
    media: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      height: 150,
      justifyContent: 'center',
      marginTop: 10,
    },
    mediaText: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 6,
    },
    reactionCount: {
      color: colors.textMuted,
      fontSize: 12,
      marginRight: 8,
    },
    reactionCounts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    text: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 21,
    },
    time: {
      color: colors.textMuted,
      flex: 1,
      fontSize: 12,
    },
  });
