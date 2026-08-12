import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ThemeColors } from '../utils/colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type ChatInfoCardProps = {
  colors: ThemeColors;
  title?: string;
  children?: ReactNode;
};

type ChatInfoRowProps = {
  colors: ThemeColors;
  label: string;
  value?: string;
  danger?: boolean;
  ionIcon?: IoniconName;
  materialIcon?: MaterialIconName;
  trailing?: ReactNode;
  onPress?: () => void;
};

export default function ChatInfoCard({ colors, title, children }: ChatInfoCardProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

export function ChatInfoRow({
  colors,
  label,
  value,
  danger,
  ionIcon,
  materialIcon,
  trailing,
  onPress,
}: ChatInfoRowProps) {
  const styles = createStyles(colors);
  const iconColor = danger ? colors.danger : colors.textMuted;
  const content = (
    <View style={styles.row}>
      <View style={styles.iconShell}>
        {ionIcon && <Ionicons name={ionIcon} size={22} color={iconColor} />}
        {materialIcon && <MaterialCommunityIcons name={materialIcon} size={22} color={iconColor} />}
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.label, danger && styles.dangerLabel]}>{label}</Text>
        {value && <Text numberOfLines={1} style={styles.value}>{value}</Text>}
      </View>
      {trailing}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity activeOpacity={0.72} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: 10,
      paddingVertical: 6,
    },
    title: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      paddingHorizontal: 18,
      paddingVertical: 9,
      textTransform: 'uppercase',
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 54,
      paddingHorizontal: 18,
    },
    iconShell: {
      alignItems: 'center',
      height: 34,
      justifyContent: 'center',
      marginRight: 14,
      width: 34,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    label: {
      color: colors.text,
      fontSize: 16,
    },
    dangerLabel: {
      color: colors.danger,
    },
    value: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
  });
