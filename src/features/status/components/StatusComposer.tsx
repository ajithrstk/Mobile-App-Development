import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StatusFontFamily, StatusPrivacy, StatusTextAlignment, StatusTextStyle } from '../types/status.types';
import type { ThemeColors } from '../../../utils/colors';

type StatusComposerProps = {
  colors: ThemeColors;
  text: string;
  onTextChange: (text: string) => void;
  textStyle: StatusTextStyle;
  onTextStyleChange: (style: StatusTextStyle) => void;
  privacy: StatusPrivacy;
  selectedCount: number;
  onOpenPrivacy: () => void;
};

const backgrounds = ['#128C7E', '#1F7AEC', '#7B3F98', '#D64B4B', '#455A64', '#111B21'];
const fonts: StatusFontFamily[] = ['system', 'serif', 'mono', 'casual'];
const aligns: StatusTextAlignment[] = ['left', 'center', 'right'];

export default function StatusComposer({
  colors,
  onOpenPrivacy,
  onTextChange,
  onTextStyleChange,
  privacy,
  selectedCount,
  text,
  textStyle,
}: StatusComposerProps) {
  const styles = createStyles(colors, textStyle);

  return (
    <View style={styles.shell}>
      <TextInput
        multiline
        onChangeText={onTextChange}
        placeholder="Type a status"
        placeholderTextColor="rgba(255,255,255,0.7)"
        style={styles.input}
        value={text}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbar} contentContainerStyle={styles.toolbarContent}>
        {backgrounds.map((backgroundColor) => (
          <Pressable
            key={backgroundColor}
            onPress={() => onTextStyleChange({ ...textStyle, backgroundColor })}
            style={[styles.swatch, { backgroundColor }, textStyle.backgroundColor === backgroundColor && styles.selectedSwatch]}
          />
        ))}
        {fonts.map((fontFamily) => (
          <Pressable key={fontFamily} onPress={() => onTextStyleChange({ ...textStyle, fontFamily })} style={styles.toolChip}>
            <Text style={styles.toolText}>{fontFamily}</Text>
          </Pressable>
        ))}
        {aligns.map((alignment) => (
          <Pressable key={alignment} onPress={() => onTextStyleChange({ ...textStyle, alignment })} style={styles.toolIcon}>
            <Ionicons name={alignment === 'left' ? 'text-outline' : alignment === 'center' ? 'reorder-three-outline' : 'menu-outline'} size={18} color={colors.text} />
          </Pressable>
        ))}
        <Pressable onPress={() => onTextStyleChange({ ...textStyle, fontSize: textStyle.fontSize >= 34 ? 22 : textStyle.fontSize + 4 })} style={styles.toolChip}>
          <Text style={styles.toolText}>Size</Text>
        </Pressable>
        <Pressable onPress={() => onTextChange(`${text} 😊`)} style={styles.toolIcon}>
          <Text style={styles.emoji}>😊</Text>
        </Pressable>
      </ScrollView>
      <Pressable onPress={onOpenPrivacy} style={styles.privacyRow}>
        <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
        <Text style={styles.privacyText}>
          {privacy.mode === 'contacts'
            ? 'My contacts'
            : privacy.mode === 'contacts-except'
              ? `My contacts except ${selectedCount}`
              : `Only share with ${selectedCount}`}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors, textStyle: StatusTextStyle) =>
  StyleSheet.create({
    emoji: {
      fontSize: 18,
    },
    input: {
      color: textStyle.color,
      flex: 1,
      fontFamily: textStyle.fontFamily === 'mono' ? 'monospace' : textStyle.fontFamily === 'serif' ? 'serif' : undefined,
      fontSize: textStyle.fontSize,
      fontWeight: textStyle.fontFamily === 'casual' ? '600' : '400',
      paddingHorizontal: 24,
      textAlign: textStyle.alignment,
      textAlignVertical: 'center',
    },
    privacyRow: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.background,
      borderRadius: 18,
      flexDirection: 'row',
      marginBottom: 12,
      minHeight: 36,
      paddingHorizontal: 14,
    },
    privacyText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 6,
    },
    selectedSwatch: {
      borderColor: colors.badgeText,
      borderWidth: 2,
    },
    shell: {
      backgroundColor: textStyle.backgroundColor,
      flex: 1,
    },
    swatch: {
      borderColor: 'rgba(255,255,255,0.45)',
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      height: 32,
      marginRight: 8,
      width: 32,
    },
    toolChip: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 16,
      height: 32,
      justifyContent: 'center',
      marginRight: 8,
      paddingHorizontal: 12,
    },
    toolIcon: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 16,
      height: 32,
      justifyContent: 'center',
      marginRight: 8,
      width: 32,
    },
    toolbar: {
      maxHeight: 52,
    },
    toolbarContent: {
      alignItems: 'center',
      paddingHorizontal: 14,
    },
    toolText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
  });
