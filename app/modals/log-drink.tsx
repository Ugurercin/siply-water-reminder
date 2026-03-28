import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogDrinkModal(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-foreground text-xl font-bold">Log a Drink</Text>
          <Pressable
            onPress={() => router.back()}
            android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
          >
            <Text className="text-primary font-bold">Done</Text>
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground text-sm text-center">
            Phase 5 will build the drink type selector and amount input here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
