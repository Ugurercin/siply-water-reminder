import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SettingsScreen(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-2xl font-bold">Settings</Text>
        <Text className="text-muted-foreground text-base mt-2">App Settings Screen</Text>
        <Text className="text-muted-foreground text-sm mt-4 text-center">
          Phase 8 will build reminders, units, themes and IAP settings here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
