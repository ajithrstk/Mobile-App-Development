import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { ThemeColors } from '../../utils/colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type CallControlButtonProps = {
  icon: IoniconName;
  label: string;
  colors: ThemeColors;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function CallControlButton({
  active,
  colors,
  danger,
  disabled,
  icon,
  label,
  onPress,
}: CallControlButtonProps) {
  const styles = createStyles(colors, active, danger, disabled);

  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      activeOpacity={0.78}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
    >
      <Ionicons name={icon} size={25} color={danger || active ? colors.badgeText : colors.text} />
      <Text numberOfLines={1} style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors, active?: boolean, danger?: boolean, disabled?: boolean) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: danger ? colors.danger : active ? colors.primaryDark : colors.background,
      borderColor: active ? 'rgba(255, 255, 255, 0.26)' : colors.divider,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      elevation: disabled ? 0 : 2,
      height: 74,
      justifyContent: 'center',
      opacity: disabled ? 0.45 : 1,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: disabled ? 0 : 0.12,
      shadowRadius: 4,
      width: 82,
    },
    label: {
      color: danger || active ? colors.badgeText : colors.textMuted,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 5,
      textAlign: 'center',
    },
  });
