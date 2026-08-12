import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DeliveryStatus from './DeliveryStatus';
import type { ChatMessage } from '../types/message';
import type { ThemeColors } from '../utils/colors';
import { formatMessageTime } from '../utils/chat';

type VoiceMessageProps = {
  message: ChatMessage;
  colors: ThemeColors;
  width: number;
};

const waveformBars = [24, 18, 31, 21, 28, 19, 34, 22, 27, 33, 20, 29, 31, 23, 18, 25, 30, 22, 27, 35, 20, 28, 24, 31, 18, 26, 33, 23];
const speeds = [1, 1.5, 2] as const;

function parseDurationToMs(duration?: string): number {
  if (!duration) {
    return 30000;
  }

  const [minutes = '0', seconds = '0'] = duration.split(':');
  const parsedMinutes = Number(minutes);
  const parsedSeconds = Number(seconds);

  if (Number.isNaN(parsedMinutes) || Number.isNaN(parsedSeconds)) {
    return 30000;
  }

  return Math.max((parsedMinutes * 60 + parsedSeconds) * 1000, 1000);
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function VoiceMessage({ message, colors, width }: VoiceMessageProps) {
  const isMine = message.sender === 'me';
  const styles = useMemo(() => createStyles(colors, width, isMine), [colors, isMine, width]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const trackWidthRef = useRef(1);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(() => message.durationMs ?? parseDurationToMs(message.duration));
  const playbackRate = speeds[speedIndex];
  const progress = durationMs > 0 ? clamp(positionMs / durationMs, 0, 1) : 0;

  useEffect(
    () => {
      setPositionMs(0);
      setDurationMs(message.durationMs ?? parseDurationToMs(message.duration));
      setPlaying(false);

      return () => {
        void soundRef.current?.unloadAsync();
        soundRef.current = null;
      };
    },
    [message.duration, message.durationMs, message.localAudioUri],
  );

  useEffect(() => {
    if (!playing || message.localAudioUri) {
      return undefined;
    }

    const interval = setInterval(() => {
      setPositionMs((currentPosition) => {
        const nextPosition = currentPosition + 250 * playbackRate;

        if (nextPosition >= durationMs) {
          setPlaying(false);
          return 0;
        }

        return nextPosition;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [durationMs, message.localAudioUri, playbackRate, playing]);

  const ensureSound = useCallback(async () => {
    if (!message.localAudioUri) {
      return null;
    }

    if (soundRef.current) {
      return soundRef.current;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: message.localAudioUri },
        {
          progressUpdateIntervalMillis: 250,
          rate: playbackRate,
          shouldCorrectPitch: true,
          shouldPlay: false,
        },
        (status) => {
          if (!status.isLoaded) {
            return;
          }

          setPositionMs(status.positionMillis);
          setDurationMs(status.durationMillis ?? message.durationMs ?? parseDurationToMs(message.duration));
          setPlaying(status.isPlaying);

          if (status.isLoaded && status.didJustFinish) {
            setPlaying(false);
            setPositionMs(0);
            void soundRef.current?.setPositionAsync(0);
          }
        },
      );

      soundRef.current = sound;

      return sound;
    } catch {
      return null;
    }
  }, [message.duration, message.durationMs, message.localAudioUri, playbackRate]);

  const togglePlayback = async () => {
    if (!message.localAudioUri) {
      setPlaying((currentValue) => !currentValue);
      return;
    }

    const sound = await ensureSound();

    if (!sound) {
      return;
    }

    const status = await sound.getStatusAsync();

    if (status.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
      setPlaying(false);
      return;
    }

    await sound.setRateAsync(playbackRate, true);
    await sound.playAsync();
    setPlaying(true);
  };

  const cycleSpeed = async () => {
    const nextIndex = (speedIndex + 1) % speeds.length;
    setSpeedIndex(nextIndex);
    await soundRef.current?.setRateAsync(speeds[nextIndex], true);
  };

  const seekToRatio = useCallback(
    async (ratio: number) => {
      const nextPosition = clamp(ratio, 0, 1) * durationMs;
      setPositionMs(nextPosition);

      if (!message.localAudioUri) {
        return;
      }

      const sound = await ensureSound();
      await sound?.setPositionAsync(nextPosition);
    },
    [durationMs, ensureSound, message.localAudioUri],
  );

  const seekResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          void seekToRatio(event.nativeEvent.locationX / trackWidthRef.current);
        },
        onPanResponderMove: (event) => {
          void seekToRatio(event.nativeEvent.locationX / trackWidthRef.current);
        },
      }),
    [seekToRatio],
  );

  return (
    <View style={styles.voiceNote}>
      <View style={styles.mainRow}>
        {isMine && <VoiceAvatar colors={colors} isMine={isMine} styles={styles} />}
        <VoiceControl onPress={togglePlayback} playing={playing} styles={styles} />
        <View style={styles.audioContent}>
          <View
            {...seekResponder.panHandlers}
            onLayout={(event) => {
              trackWidthRef.current = Math.max(event.nativeEvent.layout.width, 1);
            }}
            style={styles.waveform}
          >
            {waveformBars.map((height, index) => {
              const isPlayed = index / waveformBars.length <= progress;

              return (
                <View
                  key={`${message.id}-bar-${index}`}
                  style={[
                    styles.waveBar,
                    {
                    backgroundColor: isPlayed ? styles.playedBar.color : styles.remainingBar.color,
                    height,
                    opacity: playing && index % 3 === 0 ? 1 : index % 3 === 0 ? 0.7 : 0.94,
                  },
                ]}
              />
              );
            })}
            <View style={[styles.seekLine, { width: `${progress * 100}%` }]} />
            <View style={[styles.seekThumb, { left: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.duration}>{formatDuration(positionMs)}</Text>
            <View style={styles.messageMeta}>
              <TouchableOpacity activeOpacity={0.72} onPress={cycleSpeed} style={styles.speedButton}>
                <Text style={styles.speedText}>{speeds[speedIndex]}x</Text>
              </TouchableOpacity>
              <Text style={styles.sentTime}>{formatMessageTime(message.timestamp)}</Text>
              <DeliveryStatus status={message.status ?? 'read'} colors={colors} />
            </View>
          </View>
        </View>
        {!isMine && <VoiceAvatar colors={colors} isMine={isMine} styles={styles} />}
      </View>
    </View>
  );
}

type VoiceStyle = ReturnType<typeof createStyles>;

function VoiceControl({
  playing,
  styles,
  onPress,
}: {
  playing: boolean;
  styles: VoiceStyle;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.playButton}>
      {playing ? (
        <View style={styles.pauseIcon}>
          <View style={styles.pauseBar} />
          <View style={styles.pauseBar} />
        </View>
      ) : (
        <View style={styles.playTriangle} />
      )}
    </TouchableOpacity>
  );
}

function VoiceAvatar({
  colors,
  isMine,
  styles,
}: {
  colors: ThemeColors;
  isMine: boolean;
  styles: VoiceStyle;
}) {
  return (
    <View style={styles.avatarWrap}>
      <View style={styles.avatar}>
        <View style={styles.avatarHead} />
        <View style={styles.avatarBody} />
      </View>
      <View style={styles.micBadge}>
        <Ionicons name="mic" size={22} color={isMine ? '#1FA7F2' : '#1FA7F2'} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, screenWidth: number, isMine: boolean) => {
  const controlColor = '#707070';
  const playedWaveColor = '#777777';
  const mutedWaveColor = '#D7D7D7';
  const avatarBackground = '#BDBDBD';

  return {
    playedBar: {
      color: playedWaveColor,
    },
    remainingBar: {
      color: mutedWaveColor,
    },
    ...StyleSheet.create({
    voiceNote: {
      paddingBottom: 1,
      paddingTop: 1,
      width: Math.min(screenWidth * 0.71, 390),
    },
    mainRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 72,
    },
    playButton: {
      alignItems: 'center',
      height: 52,
      justifyContent: 'center',
      marginHorizontal: 6,
      width: 36,
    },
    playTriangle: {
      borderBottomColor: 'transparent',
      borderBottomWidth: 12,
      borderLeftColor: controlColor,
      borderLeftWidth: 19,
      borderTopColor: 'transparent',
      borderTopWidth: 12,
      height: 0,
      marginLeft: 3,
      width: 0,
    },
    pauseIcon: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 28,
      justifyContent: 'center',
      width: 24,
    },
    pauseBar: {
      backgroundColor: controlColor,
      borderRadius: 2,
      height: 25,
      marginHorizontal: 3,
      width: 6,
    },
    audioContent: {
      flex: 1,
      minWidth: 0,
    },
    waveform: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 42,
      justifyContent: 'space-between',
      overflow: 'visible',
      position: 'relative',
    },
    waveBar: {
      borderRadius: 2,
      width: 3,
      zIndex: 2,
    },
    seekLine: {
      backgroundColor: playedWaveColor,
      borderRadius: 1,
      height: 2,
      left: 0,
      opacity: 0,
      position: 'absolute',
      right: 0,
      top: 20,
      zIndex: 1,
    },
    seekThumb: {
      backgroundColor: playedWaveColor,
      borderColor: isMine ? colors.outgoingBubble : colors.background,
      borderRadius: 5,
      borderWidth: 2,
      height: 10,
      marginLeft: -5,
      position: 'absolute',
      top: 16,
      width: 10,
      zIndex: 3,
    },
    timeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: -3,
    },
    duration: {
      color: '#6B6B6B',
      fontSize: 18,
      fontWeight: '400',
    },
    messageMeta: {
      alignItems: 'center',
      flexDirection: 'row',
      marginLeft: 10,
    },
    sentTime: {
      color: '#4F4F4F',
      fontSize: 14,
      marginLeft: 8,
    },
    speedButton: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: 9,
      height: 20,
      justifyContent: 'center',
      minWidth: 30,
    },
    speedText: {
      color: '#6B6B6B',
      fontSize: 11,
      fontWeight: '500',
    },
    avatarWrap: {
      height: 60,
      marginHorizontal: 4,
      position: 'relative',
      width: 58,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: avatarBackground,
      borderRadius: 29,
      height: 58,
      justifyContent: 'flex-end',
      overflow: 'hidden',
      width: 58,
    },
    avatarHead: {
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      height: 28,
      position: 'absolute',
      top: 10,
      width: 28,
    },
    avatarBody: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      height: 24,
      width: 48,
    },
    micBadge: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      bottom: -5,
      height: 30,
      justifyContent: 'center',
      position: 'absolute',
      right: isMine ? -6 : 36,
      width: 24,
    },
  }),
  };
};
