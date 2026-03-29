import React, { useEffect, useMemo, useRef } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#2DC8A0',
  '#60D394',
  '#FFD166',
  '#F4845F',
  '#A78BFA',
  '#60A5FA',
  '#F472B6',
];

const PIECE_COUNT = 52;

interface PieceProps {
  index: number;
}

function ConfettiPiece({ index }: PieceProps): React.JSX.Element {
  const config = useMemo(() => {
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length] ?? '#2DC8A0';
    const isRect = index % 3 !== 0;

    const startX =
      (index / PIECE_COUNT) * SCREEN_WIDTH * 1.15 -
      SCREEN_WIDTH * 0.075 +
      (Math.random() - 0.5) * 70;

    const driftX = (Math.random() - 0.5) * 180;
    const delay = Math.random() * 700;
    const duration = 1800 + Math.random() * 900;
    const startRotation = Math.random() * 360;
    const endRotation =
      startRotation +
      (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);

    const size = 7 + Math.random() * 9;
    const targetY = SCREEN_HEIGHT * (0.82 + Math.random() * 0.18);
    const startScale = 0.85 + Math.random() * 0.35;
    const midScale = startScale + 0.25;
    const endScale = 0.75 + Math.random() * 0.3;

    return {
      color,
      isRect,
      startX,
      driftX,
      delay,
      duration,
      startRotation,
      endRotation,
      size,
      targetY,
      startScale,
      midScale,
      endScale,
    };
  }, [index]);

  const translateY = useSharedValue(-30);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(config.startRotation);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(config.startScale);

  useEffect(() => {
    translateY.value = withDelay(
      config.delay,
      withTiming(config.targetY, {
        duration: config.duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      config.delay,
      withTiming(config.driftX, {
        duration: config.duration,
        easing: Easing.inOut(Easing.sin),
      })
    );

    rotate.value = withDelay(
      config.delay,
      withTiming(config.endRotation, {
        duration: config.duration,
        easing: Easing.linear,
      })
    );

    scale.value = withDelay(
      config.delay,
      withSequence(
        withTiming(config.midScale, {
          duration: Math.floor(config.duration * 0.35),
          easing: Easing.out(Easing.quad),
        }),
        withTiming(config.endScale, {
          duration: Math.floor(config.duration * 0.65),
          easing: Easing.inOut(Easing.quad),
        })
      )
    );

    opacity.value = withDelay(
      config.delay,
      withSequence(
        withTiming(1, { duration: 120 }),
        withDelay(
          Math.max(0, config.duration - 700),
          withTiming(0, { duration: 500 })
        )
      )
    );
  }, [config, opacity, rotate, scale, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: config.startX + translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: config.isRect ? config.size * 0.6 : config.size,
          height: config.isRect ? config.size * 1.7 : config.size,
          borderRadius: config.isRect ? 2 : config.size / 2,
          backgroundColor: config.color,
        },
        style,
      ]}
    />
  );
}

interface ConfettiCelebrationProps {
  active: boolean;
}

export function ConfettiCelebration({
  active,
}: ConfettiCelebrationProps): React.JSX.Element | null {
  const [visible, setVisible] = React.useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      setVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 3600);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: PIECE_COUNT }, (_, i) => (
        <ConfettiPiece key={`top-${i}`} index={i} />
      ))}

      {Array.from({ length: Math.floor(PIECE_COUNT * 0.45) }, (_, i) => (
        <ConfettiPiece key={`extra-${i}`} index={i + PIECE_COUNT} />
      ))}
    </View>
  );
}