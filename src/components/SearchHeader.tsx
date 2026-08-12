import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { TextStyle } from 'react-native';
import type { ThemeColors } from '../utils/colors';

type SearchHeaderProps = {
  colors: ThemeColors;
  value: string;
  resultCount: number;
  currentIndex: number;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
};

const webInputFocusReset = Platform.OS === 'web' ? ({ outlineWidth: 0 } as TextStyle) : undefined;

export default function SearchHeader({
  colors,
  value,
  resultCount,
  currentIndex,
  onChangeText,
  onClose,
  onNext,
  onPrevious,
}: SearchHeaderProps) {
  const styles = createStyles(colors);
  const counter = resultCount === 0 ? '0/0' : `${currentIndex + 1}/${resultCount}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity accessibilityLabel="Close search" onPress={onClose} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={24} color={colors.icon} />
      </TouchableOpacity>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        onChangeText={onChangeText}
        placeholder="Search messages"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={[styles.input, webInputFocusReset]}
        value={value}
      />
      <Text style={styles.counter}>{counter}</Text>
      <TouchableOpacity
        accessibilityLabel="Previous result"
        disabled={resultCount === 0}
        onPress={onPrevious}
        style={[styles.iconButton, resultCount === 0 && styles.disabledButton]}
      >
        <Ionicons name="chevron-up" size={23} color={colors.icon} />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel="Next result"
        disabled={resultCount === 0}
        onPress={onNext}
        style={[styles.iconButton, resultCount === 0 && styles.disabledButton]}
      >
        <Ionicons name="chevron-down" size={23} color={colors.icon} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 58,
      paddingHorizontal: 6,
    },
    iconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 38,
    },
    disabledButton: {
      opacity: 0.38,
    },
    input: {
      color: colors.text,
      flex: 1,
      fontSize: 17,
      fontWeight: '400',
      minHeight: 44,
      paddingHorizontal: 6,
    },
    counter: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      minWidth: 44,
      textAlign: 'center',
    },
  });
