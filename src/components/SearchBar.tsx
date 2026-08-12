import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import type { ForwardedRef } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import type { TextStyle } from 'react-native';
import type { ThemeColors } from '../utils/colors';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  colors: ThemeColors;
  placeholder?: string;
};

const webInputFocusReset = Platform.OS === 'web' ? ({ outlineWidth: 0 } as TextStyle) : undefined;

function SearchBar(
  { value, onChangeText, colors, placeholder = 'Search or start a new chat' }: SearchBarProps,
  ref: ForwardedRef<TextInput>,
) {
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color={colors.textMuted} />
      <TextInput
        ref={ref}
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={[styles.input, webInputFocusReset]}
      />
      {value.length > 0 && (
        <TouchableOpacity
          accessibilityLabel="Clear search"
          activeOpacity={0.72}
          onPress={() => onChangeText('')}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={19} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default forwardRef<TextInput, SearchBarProps>(SearchBar);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    flexDirection: 'row',
    marginHorizontal: 14,
    marginVertical: 12,
    paddingHorizontal: 14,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    minHeight: 44,
    paddingLeft: 8,
  },
  clearButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});
