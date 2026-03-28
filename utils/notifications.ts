import type { AppSettings } from '@/types';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

interface NotificationMessage {
  title: string;
  body: string;
}

const MESSAGES: NotificationMessage[] = [
  { title: 'Time to hydrate! 💧', body: 'A glass of water keeps you sharp and energized.' },
  { title: 'Water break! 🥤', body: "Don't forget to drink — your body will thank you." },
  { title: 'Hydration check! 💧', body: "How's your water intake looking today?" },
  { title: 'Drink up! 💧', body: 'Even mild dehydration affects focus and mood.' },
  { title: 'Water time! 🌊', body: 'Keep sipping — every drop counts toward your goal.' },
  { title: 'Stay hydrated! 💧', body: 'Your daily goal is waiting — time for a sip!' },
  { title: 'Quick reminder 🥤', body: "Have you had some water recently? Now's a good time!" },
  { title: 'Hydration reminder 💧', body: 'Small sips throughout the day make a big difference.' },
];

function getRandomMessage(): NotificationMessage {
  const index = Math.floor(Math.random() * MESSAGES.length);
  return MESSAGES[index] ?? {
    title: 'Time to hydrate! 💧',
    body: 'Keep sipping throughout the day.',
  };
}

function parseHour(timeStr: string): number {
  const colonIndex = timeStr.indexOf(':');
  const hourStr = colonIndex > -1 ? timeStr.slice(0, colonIndex) : timeStr;
  const parsed = parseInt(hourStr, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildTriggerHours(
  quietHoursEnd: string,
  quietHoursStart: string,
  intervalHours: number,
): number[] {
  const startHour = parseHour(quietHoursEnd);
  const endHour = parseHour(quietHoursStart);

  if (intervalHours <= 0) return [startHour];

  const hours: number[] = [];

  if (startHour < endHour) {
    for (let hour = startHour; hour < endHour; hour += intervalHours) {
      hours.push(hour);
    }
    return hours.length > 0 ? hours : [startHour];
  }

  for (let hour = startHour; hour < 24; hour += intervalHours) {
    hours.push(hour);
  }

  for (let hour = 0; hour < endHour; hour += intervalHours) {
    if (!hours.includes(hour)) {
      hours.push(hour);
    }
  }

  return hours.length > 0 ? hours : [startHour];
}

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (isExpoGo()) return;

  const Notifications = await import('expo-notifications');
  await Notifications.setNotificationChannelAsync('hydration', {
    name: 'Hydration Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function scheduleHydrationReminders(settings: AppSettings): Promise<void> {
  const Notifications = await import('expo-notifications');

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.reminderEnabled) return;

  const permissionResponse = await Notifications.requestPermissionsAsync();
  if (permissionResponse.status !== 'granted') return;

  const triggerHours = buildTriggerHours(
    settings.quietHoursEnd,
    settings.quietHoursStart,
    settings.reminderIntervalHours,
  );

  for (const hour of triggerHours) {
    const msg = getRandomMessage();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound: true,
        ...(Platform.OS === 'android' && !isExpoGo() ? { channelId: 'hydration' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute: 0,
        repeats: true,
      },
    });
  }
}

export async function cancelHydrationReminders(): Promise<void> {
  const Notifications = await import('expo-notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}