import { Platform, Pressable, Text } from 'react-native';

interface DrinkButtonProps {
  /** Primary label shown on the button (e.g. "250 ml", "+ Custom") */
  label: string;
  onPress: () => void;
}

/**
 * Quick-add drink button used on the Home screen.
 * Uses Pressable with an Android ripple and iOS opacity feedback.
 * Styled with NativeWind; no hardcoded colors.
 */
export function DrinkButton({ label, onPress }: DrinkButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(45, 200, 160, 0.15)', borderless: false }}
      style={({ pressed }) => [
        pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
      ]}
      className="flex-1 items-center justify-center bg-secondary rounded-2xl py-5 mx-1"
    >
      <Text className="text-primary text-base font-bold">{label}</Text>
    </Pressable>
  );
}
