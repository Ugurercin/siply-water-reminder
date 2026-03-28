import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

// Wrap Circle so react-native-reanimated can drive its props on the native thread
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0–1 progress value. Values outside this range are clamped. */
  progress: number;
  /** Outer diameter of the ring in dp. Default: 240 */
  size?: number;
  /** Ring stroke thickness in dp. Default: 20 */
  strokeWidth?: number;
  /** Hex color for the filled arc. Default: Ocean primary */
  color?: string;
  /** Hex color for the unfilled track. Default: Ocean light */
  trackColor?: string;
  /** Content rendered in the center of the ring (e.g. percentage text) */
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 240,
  strokeWidth = 20,
  color = '#2DC8A0',
  trackColor = '#D6F5EE',
  children,
}: ProgressRingProps): React.JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  // Start fully unfilled; animate toward the target offset on each progress change
  const dashOffset = useSharedValue(circumference);

  useEffect(() => {
    dashOffset.value = withTiming(circumference * (1 - clamped), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, circumference, dashOffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const center = size / 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* SVG ring sits behind children via absolute positioning */}
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Unfilled track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated filled arc — starts from 12 o'clock (rotation -90°) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      {/* Center content (percentage, amounts, etc.) */}
      {children}
    </View>
  );
}
