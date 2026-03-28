import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-2xl font-bold">History</Text>
        <Text className="text-muted-foreground text-base mt-2">History & Stats Screen</Text>
        <Text className="text-muted-foreground text-sm mt-4 text-center">
          Phase 7 will build the bar chart and streak stats here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
