import { Text, View } from 'react-native';

interface StatCardProps {
  emoji: string;
  label: string;
  value: string;
}

/**
 * Small stat summary card used on the History screen.
 * Displays an emoji icon, a primary value, and a label below.
 */
export function StatCard({ emoji, label, value }: StatCardProps): React.JSX.Element {
  return (
    <View className="flex-1 bg-card rounded-2xl py-4 px-2 items-center mx-1">
      <Text className="text-2xl">{emoji}</Text>
      <Text
        className="text-foreground text-sm font-bold mt-2 text-center"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text className="text-muted-foreground text-xs text-center mt-1" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}
