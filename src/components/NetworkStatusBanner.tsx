import { StyleSheet, Text, View } from 'react-native';
import { ConnectionState } from '../services/network/networkManager';
import { useNetworkState } from '../services/network/useNetworkState';
import type { ThemeColors } from '../utils/colors';

type NetworkStatusBannerProps = {
  colors: ThemeColors;
};

export default function NetworkStatusBanner({ colors }: NetworkStatusBannerProps) {
  const { queueSize, state } = useNetworkState();
  const styles = createStyles(colors);

  if (state === ConnectionState.Connected) {
    return null;
  }

  const label = state === ConnectionState.Offline
    ? 'Offline'
    : state === ConnectionState.Retrying
      ? `Retrying${queueSize > 0 ? ` ${queueSize} queued` : ''}`
      : state === ConnectionState.Reconnecting
        ? 'Reconnecting'
        : 'Connection failed';

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    banner: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      minHeight: 30,
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    text: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
  });
