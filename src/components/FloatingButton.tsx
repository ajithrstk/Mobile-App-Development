import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import type { ThemeColors } from '../utils/colors';

type FloatingButtonProps = {
  onPress: () => void;
  colors: ThemeColors;
};

export default function FloatingButton({ onPress, colors }: FloatingButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [scale]);

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.pressable}>
      <Ionicons name="chatbubble-ellipses" size={26} color={colors.badgeText} />
    </Pressable>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 18,
    bottom: 24,
    elevation: 6,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: 58,
  },
  pressable: {
    alignItems: 'center',
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
});
