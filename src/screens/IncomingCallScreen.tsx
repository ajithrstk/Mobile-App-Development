import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { Alert, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCallSession } from '../calls/hooks/useCallSession';
import { callService } from '../calls/services/callService';
import { CallDirection } from '../calls/types/call';
import type { RootStackParamList } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type IncomingCallScreenProps = NativeStackScreenProps<RootStackParamList, 'IncomingCallScreen'>;

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export default function IncomingCallScreen({ navigation, route }: IncomingCallScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { accept, reject, session } = useCallSession();

  useEffect(() => {
    void callService
      .startCall({
        callId: route.params.callId,
        contact: route.params.contact,
        direction: CallDirection.Incoming,
        mode: route.params.mode,
      })
      .catch((error) => {
        Alert.alert('Call unavailable', error instanceof Error ? error.message : 'Unable to receive this call.');
        navigation.goBack();
      });
  }, [navigation, route.params.callId, route.params.contact, route.params.mode]);

  useEffect(() => {
    if (!session) {
      return;
    }
  }, [session]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.label}>{route.params.mode === 'video' ? 'Incoming video call' : 'Incoming voice call'}</Text>
        <Image source={route.params.contact.avatar} style={styles.avatar} />
        <Text numberOfLines={1} style={styles.name}>{route.params.contact.name}</Text>
        <Text style={styles.status}>Ringing</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityLabel="Reject call"
          activeOpacity={0.82}
          onPress={() => {
            reject();
            navigation.goBack();
          }}
          style={[styles.callButton, styles.rejectButton]}
        >
          <Text style={styles.buttonText}>Reject</Text>
          <Ionicons name="call" size={30} color={colors.badgeText} style={styles.callIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Accept call"
          activeOpacity={0.82}
          onPress={() => {
            accept();
            navigation.replace('CallScreen', {
              callId: route.params.callId,
              contact: route.params.contact,
              mode: route.params.mode,
              resumeExisting: true,
            });
          }}
          style={[styles.callButton, styles.acceptButton]}
        >
          <Text style={styles.buttonText}>Accept</Text>
          <Ionicons name="call" size={30} color={colors.badgeText} style={styles.callIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    acceptButton: {
      backgroundColor: colors.accent,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingBottom: 46,
      paddingHorizontal: 24,
    },
    avatar: {
      borderColor: colors.icon,
      borderRadius: 72,
      borderWidth: 3,
      height: 144,
      marginTop: 32,
      width: 144,
    },
    buttonText: {
      color: colors.badgeText,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 16,
      marginBottom: 8,
      textAlign: 'center',
      width: '100%',
    },
    callButton: {
      alignItems: 'center',
      borderRadius: 40,
      height: 80,
      justifyContent: 'center',
      width: 80,
    },
    callIcon: {
      transform: [{ rotate: '135deg' }],
    },
    content: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: androidTopInset,
    },
    label: {
      color: colors.icon,
      fontSize: 15,
      fontWeight: '500',
      opacity: 0.82,
    },
    name: {
      color: colors.icon,
      fontSize: 28,
      fontWeight: '500',
      marginTop: 22,
      maxWidth: '92%',
    },
    rejectButton: {
      backgroundColor: colors.danger,
    },
    safeArea: {
      backgroundColor: colors.primary,
      flex: 1,
    },
    status: {
      color: colors.icon,
      fontSize: 15,
      fontWeight: '500',
      marginTop: 8,
      opacity: 0.82,
    },
  });
