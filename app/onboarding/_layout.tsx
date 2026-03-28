import { Stack } from 'expo-router';

export default function OnboardingLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
