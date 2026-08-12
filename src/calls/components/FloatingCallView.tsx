import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ThemeColors } from '../../utils/colors';
import { formatCallDuration } from '../../utils/callFormatting';
import type { CallSession } from '../types/call';

type FloatingCallViewProps = {
  colors: ThemeColors;
  session: CallSession;
  onEnd: () => void;
  onRestore: () => void;
};

export default function FloatingCallView({ colors, onEnd, onRestore, session }: FloatingCallViewProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.8} onPress={onRestore} style={styles.content}>
        <Image source={session.contact.avatar} style={styles.avatar} />
        <View style={styles.textBlock}>
          <Text numberOfLines={1} style={styles.name}>{session.contact.name}</Text>
          <Text style={styles.status}>{formatCallDuration(session.durationSeconds)}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity accessibilityLabel="End call" onPress={onEnd} style={styles.endButton}>
        <Ionicons name="call" size={18} color={colors.badgeText} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avatar: {
      borderRadius: 18,
      height: 36,
      width: 36,
    },
    container: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      bottom: 84,
      elevation: 5,
      flexDirection: 'row',
      left: 16,
      padding: 8,
      position: 'absolute',
      right: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    content: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      minWidth: 0,
    },
    endButton: {
      alignItems: 'center',
      backgroundColor: colors.danger,
      borderRadius: 20,
      height: 40,
      justifyContent: 'center',
      marginLeft: 8,
      transform: [{ rotate: '135deg' }],
      width: 40,
    },
    name: {
      color: colors.icon,
      fontSize: 14,
      fontWeight: '500',
    },
    status: {
      color: colors.icon,
      fontSize: 12,
      marginTop: 2,
      opacity: 0.86,
    },
    textBlock: {
      flex: 1,
      marginLeft: 10,
      minWidth: 0,
    },
  });
