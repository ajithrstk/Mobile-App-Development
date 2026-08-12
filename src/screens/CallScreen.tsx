import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ImageBackground, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import FloatingCallView from '../calls/components/FloatingCallView';
import { useCallSession } from '../calls/hooks/useCallSession';
import { callService } from '../calls/services/callService';
import { CallDirection, CallMode, CallState } from '../calls/types/call';
import type { RootStackParamList } from '../types';
import { formatCallDuration } from '../utils/callFormatting';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type CallScreenProps = NativeStackScreenProps<RootStackParamList, 'CallScreen'>;
type IoniconName = ComponentProps<typeof Ionicons>['name'];
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
const bg = '#050707';
const dock = '#202020';
const dockVideo = 'rgba(58, 74, 82, 0.88)';
const circle = '#0F1111';
const selected = '#F5F5F3';
const white = '#FFFFFF';
const muted = '#A8A8A8';
const danger = '#E4003E';
const green = '#1FB866';

const doodles: Array<{ icon: IoniconName; x: number; y: number; size: number; rotate?: string }> = [
  { icon: 'heart-outline', x: 7, y: 5, size: 48, rotate: '-12deg' },
  { icon: 'musical-notes-outline', x: 67, y: 7, size: 40, rotate: '10deg' },
  { icon: 'chatbubble-outline', x: 36, y: 9, size: 34, rotate: '18deg' },
  { icon: 'camera-outline', x: 16, y: 24, size: 54, rotate: '8deg' },
  { icon: 'football-outline', x: 72, y: 25, size: 52, rotate: '-18deg' },
  { icon: 'location-outline', x: 48, y: 29, size: 42, rotate: '15deg' },
  { icon: 'mic-outline', x: 10, y: 47, size: 44, rotate: '-8deg' },
  { icon: 'sunny-outline', x: 51, y: 52, size: 58, rotate: '3deg' },
  { icon: 'paper-plane-outline', x: 28, y: 61, size: 46, rotate: '-18deg' },
  { icon: 'lock-closed-outline', x: 79, y: 58, size: 42, rotate: '12deg' },
  { icon: 'calendar-outline', x: 12, y: 77, size: 56, rotate: '14deg' },
  { icon: 'happy-outline', x: 58, y: 77, size: 54, rotate: '-11deg' },
  { icon: 'videocam-outline', x: 83, y: 83, size: 44, rotate: '8deg' },
];

function callStatus(state: CallState, durationSeconds: number): string {
  if (state === CallState.Connected) {
    return formatCallDuration(durationSeconds);
  }

  if (state === CallState.Reconnecting) {
    return 'Reconnecting...';
  }

  if (state === CallState.Rejected) {
    return 'Declined';
  }

  if (state === CallState.Missed) {
    return 'No answer';
  }

  if (state === CallState.Ended) {
    return durationSeconds > 0 ? 'Call ended' : 'No answer';
  }

  return 'Calling...';
}

export default function CallScreen({ navigation, route }: CallScreenProps) {
  const colors = useThemeColors();
  const { height, width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors, width, height), [colors, height, width]);
  const {
    end,
    permissionMessage,
    session,
    switchCamera,
    switchMode,
    toggleMinimized,
    toggleMute,
    toggleSpeaker,
  } = useCallSession();
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let mounted = true;
    const activeSession = callService.getSession();

    if (route.params.resumeExisting && activeSession?.id === route.params.callId) {
      setStarting(false);
      return () => {
        mounted = false;
      };
    }

    void callService
      .startCall({
        contact: route.params.contact,
        direction: CallDirection.Outgoing,
        mode: route.params.mode,
      })
      .catch((error) => {
        Alert.alert('Call unavailable', error instanceof Error ? error.message : 'Unable to start the call.');
        navigation.goBack();
      })
      .finally(() => {
        if (mounted) {
          setStarting(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [navigation, route.params.callId, route.params.contact, route.params.mode, route.params.resumeExisting]);

  useEffect(() => {
    if (!session && !starting) {
      navigation.goBack();
    }
  }, [navigation, session, starting]);

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DoodleBackground styles={styles} />
        <View style={styles.centerFill}>
          <Text style={styles.stateText}>Starting call...</Text>
          {permissionMessage ? <Text style={styles.permissionText}>{permissionMessage}</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  if (session.minimized) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DoodleBackground styles={styles} />
        <View style={styles.centerFill}>
          <Text style={styles.nameText}>Call minimized</Text>
          <Text style={styles.stateText}>Tap the floating call to return.</Text>
        </View>
        <FloatingCallView colors={colors} onEnd={end} onRestore={toggleMinimized} session={session} />
      </SafeAreaView>
    );
  }

  const isVideo = session.mode === CallMode.Video;
  const isEnded = [CallState.Ended, CallState.Missed, CallState.Rejected].includes(session.state);
  const status = callStatus(session.state, session.durationSeconds);

  if (isEnded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DoodleBackground styles={styles} />
        <View style={styles.endedIdentity}>
          <Image source={session.contact.avatar} style={styles.endedAvatar} />
          <Text numberOfLines={1} style={styles.endedName}>{session.contact.name}</Text>
          <Text style={styles.endedStatus}>{status}</Text>
        </View>
        <View style={styles.endedControls}>
          <EndedAction icon="close" label="Cancel" light onPress={() => navigation.goBack()} styles={styles} />
          <EndedAction icon="mic" label="Record voice message" onPress={() => navigation.goBack()} styles={styles} />
          <EndedAction icon="call" label="Call again" green onPress={() => callService.startCall({ contact: session.contact, direction: CallDirection.Outgoing, mode: session.mode })} styles={styles} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {isVideo ? (
        <ImageBackground source={session.contact.avatar} resizeMode="cover" style={styles.videoBackground} blurRadius={Platform.OS === 'android' ? 1 : 2}>
          <View style={styles.videoOverlay} />
          <CallTopOverlay isVideo name={session.contact.name} status={status} onMessage={() => navigation.goBack()} onMinimize={toggleMinimized} onSwitchCamera={switchCamera} styles={styles} />
          <VideoDock
            muted={session.muted}
            onAudio={() => switchMode(CallMode.Voice)}
            onEnd={end}
            onMore={() => undefined}
            onMute={toggleMute}
            onVideo={() => switchMode(CallMode.Video)}
            speaker={session.speakerEnabled}
            onSpeaker={toggleSpeaker}
            styles={styles}
          />
        </ImageBackground>
      ) : (
        <View style={styles.audioRoot}>
          <DoodleBackground styles={styles} />
          <CallTopOverlay name={session.contact.name} status={status} onMessage={() => navigation.goBack()} onMinimize={toggleMinimized} styles={styles} />
          <View style={styles.audioAvatarWrap}>
            <Image source={session.contact.avatar} style={styles.audioAvatar} />
          </View>
          <AudioDock
            muted={session.muted}
            onAudio={() => switchMode(CallMode.Voice)}
            onEnd={end}
            onMore={() => undefined}
            onMute={toggleMute}
            onShare={() => undefined}
            onVideo={() => switchMode(CallMode.Video)}
            speaker={session.speakerEnabled}
            onSpeaker={toggleSpeaker}
            styles={styles}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function DoodleBackground({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View pointerEvents="none" style={styles.doodleLayer}>
      {doodles.map((item, index) => (
        <Ionicons
          color="#EDEDED"
          key={`${item.icon}-${index}`}
          name={item.icon}
          size={item.size}
          style={[styles.doodleIcon, { left: `${item.x}%`, top: `${item.y}%`, transform: [{ rotate: item.rotate ?? '0deg' }] }]}
        />
      ))}
    </View>
  );
}

function CallTopOverlay({
  isVideo,
  name,
  onMessage,
  onMinimize,
  onSwitchCamera,
  status,
  styles,
}: {
  isVideo?: boolean;
  name: string;
  onMessage: () => void;
  onMinimize: () => void;
  onSwitchCamera?: () => void;
  status: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      <CircleButton icon="contract-outline" onPress={onMinimize} style={styles.topLeftCircle} styles={styles} />
      <View style={styles.topIdentity}>
        <Text numberOfLines={1} style={styles.nameText}>{name}</Text>
        <Text style={styles.stateText}>{status}</Text>
      </View>
      <View style={styles.rightRail}>
        <CircleButton materialIcon="account-plus" onPress={() => undefined} styles={styles} />
        <CircleButton icon="chatbubble" onPress={onMessage} styles={styles} />
        {isVideo && <CircleButton icon="camera-reverse" onPress={onSwitchCamera ?? (() => undefined)} styles={styles} />}
      </View>
    </>
  );
}

function AudioDock({
  muted,
  onAudio,
  onEnd,
  onMore,
  onMute,
  onShare,
  onSpeaker,
  onVideo,
  speaker,
  styles,
}: {
  muted: boolean;
  onAudio: () => void;
  onEnd: () => void;
  onMore: () => void;
  onMute: () => void;
  onShare: () => void;
  onSpeaker: () => void;
  onVideo: () => void;
  speaker: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.audioDock}>
      <View style={styles.audioDockRow}>
        <ControlTile icon="videocam" label="Video" onPress={onVideo} styles={styles} />
        <ControlTile active icon={speaker ? 'volume-high' : 'volume-medium'} label="Audio" materialIcon="bluetooth" onPress={onSpeaker} styles={styles} />
        <ControlTile icon={muted ? 'mic-off' : 'mic-off'} label="Mute" onPress={onMute} styles={styles} />
      </View>
      <View style={styles.audioDockRow}>
        <ControlTile icon="ellipsis-horizontal" label="More" onPress={onMore} styles={styles} />
        <ControlTile disabled icon="people-outline" label="Share" materialIcon="monitor-account" onPress={onShare} styles={styles} />
        <ControlTile danger icon="call" label="End" onPress={onEnd} styles={styles} />
      </View>
    </View>
  );
}

function VideoDock({
  muted,
  onAudio,
  onEnd,
  onMore,
  onMute,
  onSpeaker,
  onVideo,
  speaker,
  styles,
}: {
  muted: boolean;
  onAudio: () => void;
  onEnd: () => void;
  onMore: () => void;
  onMute: () => void;
  onSpeaker: () => void;
  onVideo: () => void;
  speaker: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.videoDock}>
      <RoundControl icon="ellipsis-horizontal" onPress={onMore} styles={styles} />
      <RoundControl icon="videocam" onPress={onVideo} styles={styles} />
      <RoundControl active icon={speaker ? 'volume-high' : 'volume-medium'} materialIcon="bluetooth" onPress={onSpeaker} styles={styles} />
      <RoundControl icon={muted ? 'mic-off' : 'mic-off'} onPress={onMute} styles={styles} />
      <RoundControl danger icon="call" onPress={onEnd} styles={styles} />
    </View>
  );
}

function ControlTile({
  active,
  danger: isDanger,
  disabled,
  icon,
  label,
  materialIcon,
  onPress,
  styles,
}: {
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  icon: IoniconName;
  label: string;
  materialIcon?: MaterialIconName;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity activeOpacity={0.78} disabled={disabled} onPress={onPress} style={styles.tile}>
      <View style={[styles.tileCircle, active && styles.selectedCircle, isDanger && styles.dangerCircle, disabled && styles.disabledCircle]}>
        <Ionicons name={icon} size={26} color={active ? '#090909' : isDanger ? white : disabled ? '#5E5E5E' : white} style={isDanger ? styles.endIcon : undefined} />
        {materialIcon && <MaterialCommunityIcons name={materialIcon} size={18} color={active ? '#090909' : '#5E5E5E'} style={styles.bluetoothMini} />}
      </View>
      <Text numberOfLines={1} style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function RoundControl({
  active,
  danger: isDanger,
  icon,
  materialIcon,
  onPress,
  styles,
}: {
  active?: boolean;
  danger?: boolean;
  icon: IoniconName;
  materialIcon?: MaterialIconName;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={[styles.roundControl, active && styles.selectedCircle, isDanger && styles.dangerCircle]}>
      <Ionicons name={icon} size={24} color={active ? '#090909' : white} style={isDanger ? styles.endIcon : undefined} />
      {materialIcon && <MaterialCommunityIcons name={materialIcon} size={17} color={active ? '#090909' : white} style={styles.bluetoothMini} />}
    </TouchableOpacity>
  );
}

function CircleButton({
  icon,
  materialIcon,
  onPress,
  style,
  styles,
}: {
  icon?: IoniconName;
  materialIcon?: MaterialIconName;
  onPress: () => void;
  style?: object;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity activeOpacity={0.76} onPress={onPress} style={[styles.floatingCircle, style]}>
      {icon && <Ionicons name={icon} size={31} color={white} />}
      {materialIcon && <MaterialCommunityIcons name={materialIcon} size={32} color={white} />}
    </TouchableOpacity>
  );
}

function EndedAction({
  green: isGreen,
  icon,
  label,
  light,
  onPress,
  styles,
}: {
  green?: boolean;
  icon: IoniconName;
  label: string;
  light?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={styles.endedAction}>
      <View style={[styles.endedActionCircle, light && styles.endedLight, isGreen && styles.endedGreen]}>
        <Ionicons name={icon} size={38} color={light ? '#0B0B0B' : white} style={isGreen ? styles.callAgainIcon : undefined} />
      </View>
      <Text style={styles.endedActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (_colors: ThemeColors, width: number, height: number) => {
  const portraitWidth = Math.min(width, 560);
  const isWide = width > 650;
  const isSmall = width < 390;
  const audioDockWidth = Math.min(width - (isSmall ? 34 : 52), 410);
  const audioDockHeight = Math.min(286, Math.max(252, height * 0.28));
  const audioDockPaddingH = isSmall ? 16 : 20;
  const audioDockPaddingV = isSmall ? 14 : 18;
  const audioTileGap = isSmall ? 10 : 14;
  const audioControlSize = Math.min(isSmall ? 68 : 74, Math.max(58, (audioDockWidth - audioDockPaddingH * 2 - audioTileGap * 2) / 3));
  const audioAvatarSize = Math.min(isSmall ? 176 : 202, width * 0.48);
  const audioAvatarTop = Math.max(160, Math.min(height * 0.3, height - audioDockHeight - audioAvatarSize - 48));
  const topCircleSize = isSmall ? 68 : 76;
  const videoDockWidth = Math.min(width - (isSmall ? 58 : 72), 380);
  const videoDockHeight = isSmall ? 72 : 80;
  const videoControlSize = Math.min(isSmall ? 52 : 58, Math.max(46, (videoDockWidth - 52) / 5));

  return StyleSheet.create({
    audioAvatar: {
      borderRadius: 112,
      height: audioAvatarSize,
      width: audioAvatarSize,
    },
    audioAvatarWrap: {
      alignItems: 'center',
      backgroundColor: '#989898',
      borderRadius: audioAvatarSize / 2 + 10,
      height: audioAvatarSize + 16,
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'absolute',
      top: audioAvatarTop,
      width: audioAvatarSize + 16,
    },
    audioDock: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: dock,
      borderRadius: 34,
      bottom: isSmall ? 28 : 34,
      height: audioDockHeight,
      justifyContent: 'center',
      paddingHorizontal: audioDockPaddingH,
      paddingVertical: audioDockPaddingV,
      position: 'absolute',
      width: audioDockWidth,
    },
    audioDockRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: isSmall ? 4 : 5,
      width: '100%',
    },
    audioRoot: {
      alignItems: 'center',
      backgroundColor: bg,
      flex: 1,
      overflow: 'hidden',
      width: '100%',
    },
    bluetoothMini: {
      marginLeft: -3,
      marginTop: 3,
    },
    callAgainIcon: {
      transform: [{ rotate: '0deg' }],
    },
    centerFill: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    dangerCircle: {
      backgroundColor: danger,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    disabledCircle: {
      opacity: 0.45,
    },
    doodleIcon: {
      opacity: 0.06,
      position: 'absolute',
    },
    doodleLayer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: bg,
    },
    endIcon: {
      transform: [{ rotate: '135deg' }],
    },
    endedAction: {
      alignItems: 'center',
      flex: 1,
      maxWidth: 150,
    },
    endedActionCircle: {
      alignItems: 'center',
      backgroundColor: 'rgba(88,88,88,0.62)',
      borderRadius: isSmall ? 39 : 42,
      height: isSmall ? 78 : 84,
      justifyContent: 'center',
      width: isSmall ? 78 : 84,
    },
    endedActionText: {
      color: muted,
      fontSize: isSmall ? 16 : 17,
      lineHeight: isSmall ? 20 : 22,
      marginTop: 12,
      minHeight: 44,
      textAlign: 'center',
    },
    endedAvatar: {
      borderRadius: 72,
      height: 144,
      width: 144,
    },
    endedControls: {
      alignItems: 'flex-start',
      bottom: isSmall ? 54 : 64,
      flexDirection: 'row',
      justifyContent: 'space-between',
      left: isSmall ? 20 : 28,
      position: 'absolute',
      right: isSmall ? 20 : 28,
    },
    endedGreen: {
      backgroundColor: green,
    },
    endedIdentity: {
      alignItems: 'center',
      alignSelf: 'center',
      position: 'absolute',
      top: Math.max(120, height * 0.1),
      width: portraitWidth,
    },
    endedLight: {
      backgroundColor: selected,
    },
    endedName: {
      color: white,
      fontSize: isSmall ? 40 : 44,
      fontWeight: '500',
      marginTop: 28,
      maxWidth: '88%',
    },
    endedStatus: {
      color: muted,
      fontSize: isSmall ? 32 : 36,
      fontWeight: '400',
      marginTop: 12,
    },
    floatingCircle: {
      alignItems: 'center',
      backgroundColor: 'rgba(16, 13, 9, 0.82)',
      borderRadius: topCircleSize / 2,
      height: topCircleSize,
      justifyContent: 'center',
      marginBottom: isSmall ? 18 : 22,
      width: topCircleSize,
    },
    nameText: {
      color: white,
      fontSize: isSmall ? 30 : 32,
      fontWeight: '500',
      maxWidth: isSmall ? '46%' : '54%',
      textAlign: 'center',
    },
    permissionText: {
      color: muted,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
    rightRail: {
      position: 'absolute',
      right: isWide ? Math.max(28, (width - portraitWidth) / 2 + 20) : isSmall ? 24 : 30,
      top: (isSmall ? 42 : 48) + androidTopInset,
    },
    roundControl: {
      alignItems: 'center',
      backgroundColor: circle,
      borderRadius: videoControlSize / 2,
      height: videoControlSize,
      justifyContent: 'center',
      width: videoControlSize,
    },
    safeArea: {
      backgroundColor: bg,
      flex: 1,
    },
    selectedCircle: {
      backgroundColor: selected,
    },
    stateText: {
      color: muted,
      fontSize: isSmall ? 24 : 26,
      fontWeight: '400',
      marginTop: 5,
      textAlign: 'center',
    },
    tile: {
      alignItems: 'center',
      height: audioControlSize + (isSmall ? 31 : 35),
      justifyContent: 'flex-start',
      width: (audioDockWidth - audioDockPaddingH * 2 - audioTileGap * 2) / 3,
    },
    tileCircle: {
      alignItems: 'center',
      backgroundColor: circle,
      borderColor: '#303030',
      borderRadius: audioControlSize / 2,
      borderWidth: 1,
      flexDirection: 'row',
      height: audioControlSize,
      justifyContent: 'center',
      width: audioControlSize,
    },
    tileLabel: {
      color: white,
      fontSize: isSmall ? 14 : 16,
      fontWeight: '400',
      lineHeight: isSmall ? 18 : 20,
      marginTop: isSmall ? 7 : 8,
      maxWidth: '100%',
      textAlign: 'center',
    },
    topIdentity: {
      alignItems: 'center',
      alignSelf: 'center',
      position: 'absolute',
      top: (isSmall ? 46 : 52) + androidTopInset,
      width: portraitWidth,
      zIndex: 3,
    },
    topLeftCircle: {
      left: isWide ? Math.max(28, (width - portraitWidth) / 2 + 20) : isSmall ? 24 : 30,
      position: 'absolute',
      top: (isSmall ? 42 : 48) + androidTopInset,
      zIndex: 4,
    },
    videoBackground: {
      flex: 1,
      overflow: 'hidden',
    },
    videoDock: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: dockVideo,
      borderRadius: videoDockHeight / 2,
      bottom: isSmall ? 42 : 48,
      flexDirection: 'row',
      height: videoDockHeight,
      justifyContent: 'space-evenly',
      paddingHorizontal: isSmall ? 10 : 12,
      position: 'absolute',
      width: videoDockWidth,
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
  });
};
