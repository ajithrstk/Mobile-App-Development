import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { MessageDeliveryStatus } from '../types/message';
import type { ThemeColors } from '../utils/colors';

type DeliveryStatusProps = {
  status?: MessageDeliveryStatus;
  colors: ThemeColors;
};

export default function DeliveryStatus({ status, colors }: DeliveryStatusProps) {
  if (!status) {
    return null;
  }

  const iconName = status === 'failed'
    ? 'alert-circle-outline'
    : status === 'sending'
      ? 'time-outline'
      : status === 'sent'
        ? 'checkmark'
        : 'checkmark-done';
  const iconColor = status === 'failed'
    ? colors.danger
    : status === 'read' || status === 'seen'
      ? colors.read
      : colors.delivered;

  return (
    <View
      accessibilityLabel={`Message ${status}`}
      accessibilityRole="image"
      style={styles.container}
    >
      <Ionicons name={iconName} size={15} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 16,
    justifyContent: 'center',
    marginLeft: 3,
    width: 17,
  },
});
