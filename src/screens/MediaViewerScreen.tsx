import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { RootStackParamList } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type MediaViewerScreenProps = NativeStackScreenProps<RootStackParamList, 'MediaViewerScreen'>;

export default function MediaViewerScreen({ navigation, route }: MediaViewerScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const message = route.params.message;
  const source = message.mediaUri ? { uri: message.mediaUri } : message.image;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="close" size={26} color={colors.badgeText} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.title}>{message.fileName ?? (message.kind === 'video' ? 'Video' : 'Photo')}</Text>
      </View>
      <View style={styles.viewer}>
        {message.kind === 'video' && message.mediaUri ? (
          <Video
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            source={{ uri: message.mediaUri }}
            style={styles.video}
            useNativeControls
          />
        ) : source ? (
          <Image resizeMode="contain" source={source as ImageSourcePropType} style={styles.image} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="image-outline" size={44} color={colors.badgeText} />
            <Text style={styles.emptyText}>Media unavailable</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: '#000000',
      flex: 1,
    },
    header: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.86)',
      flexDirection: 'row',
      minHeight: 58,
      paddingHorizontal: 8,
    },
    iconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    title: {
      color: colors.badgeText,
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 4,
    },
    viewer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    image: {
      height: '100%',
      width: '100%',
    },
    video: {
      height: '100%',
      width: '100%',
    },
    empty: {
      alignItems: 'center',
    },
    emptyText: {
      color: colors.badgeText,
      fontSize: 15,
      fontWeight: '500',
      marginTop: 10,
    },
  });
