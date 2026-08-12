import { Animated, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import type { ThemeColors } from '../utils/colors';

type SkeletonChatItemProps = {
  colors: ThemeColors;
};

export default function SkeletonChatItem({ colors }: SkeletonChatItemProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  const styles = createStyles(colors);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.avatar, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.nameLine, { opacity }]} />
        <Animated.View style={[styles.messageLine, { opacity }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      minHeight: 78,
      paddingLeft: 14,
      paddingRight: 14,
    },
    avatar: {
      backgroundColor: colors.skeletonBase,
      borderRadius: 28,
      height: 56,
      width: 56,
    },
    content: {
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flex: 1,
      justifyContent: 'center',
      marginLeft: 12,
      minHeight: 78,
    },
    nameLine: {
      backgroundColor: colors.skeletonBase,
      borderRadius: 6,
      height: 16,
      width: '58%',
    },
    messageLine: {
      backgroundColor: colors.skeletonHighlight,
      borderRadius: 6,
      height: 14,
      marginTop: 12,
      width: '82%',
    },
  });
