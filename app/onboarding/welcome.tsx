import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Slide Data ───────────────────────────────────────────────────────────────

interface Slide {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    key: 'meet',
    icon: 'water',
    title: 'Meet Siply',
    description:
      'Your personal hydration companion. Drink more water, feel better every day.',
  },
  {
    key: 'track',
    icon: 'stats-chart',
    title: 'Track Your Progress',
    description:
      'See your daily intake at a glance. Every sip brings you closer to your goal.',
  },
  {
    key: 'remind',
    icon: 'notifications',
    title: 'Smart Reminders',
    description:
      'Gentle nudges throughout the day keep you hydrated without being annoying.',
  },
];

// ─── Dot Indicator ────────────────────────────────────────────────────────────

interface DotsProps {
  count: number;
  activeIndex: number;
}

function Dots({ count, activeIndex }: DotsProps): React.JSX.Element {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className={`rounded-full ${
            i === activeIndex
              ? 'w-6 h-2 bg-primary'
              : 'w-2 h-2 bg-primary opacity-30'
          }`}
        />
      ))}
    </View>
  );
}

// ─── Individual Slide ─────────────────────────────────────────────────────────

interface SlideItemProps {
  item: Slide;
}

function SlideItem({ item }: SlideItemProps): React.JSX.Element {
  return (
    <View
      style={{ width: SCREEN_WIDTH, flex: 1 }}
      className="items-center justify-center px-10"
    >
      <View className="items-center">
        <View className="w-28 h-28 rounded-full bg-primary/10 items-center justify-center mb-8">
          <Ionicons name={item.icon} size={56} color="#2DC8A0" />
        </View>
        <Text className="text-foreground text-3xl font-bold text-center mb-4">
          {item.title}
        </Text>
        <Text className="text-muted-foreground text-base text-center leading-6">
          {item.description}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WelcomeScreen(): React.JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index !== null && first?.index !== undefined) {
        setActiveIndex(first.index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleNext = (): void => {
    if (isLastSlide) {
      router.push('/onboarding/profile');
    } else {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  const handleSkip = (): void => {
    router.push('/onboarding/profile');
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Slide>) => <SlideItem item={item} />,
    []
  );

  return (
<SafeAreaView 
  className="bg-background" 
  style={{ flex: 1 }}
  edges={['top', 'bottom']}
>
      <StatusBar style="dark" />

      {/* Skip button */}
      <View className="items-end px-6 pt-2">
        {!isLastSlide && (
          <Pressable
            onPress={handleSkip}
            android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
            className="py-2 px-4"
          >
            <Text className="text-muted-foreground text-base">Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
  data={SLIDES}
  renderItem={renderItem}
  keyExtractor={(item) => item.key}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  bounces={false}
  onViewableItemsChanged={onViewableItemsChanged}
  viewabilityConfig={viewabilityConfig.current}
  style={{ flex: 1 }}
      />

      {/* Bottom controls */}
      <View className="px-6 pb-6 gap-6">
        <Dots count={SLIDES.length} activeIndex={activeIndex} />

        <Pressable
          onPress={handleNext}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: false }}
          className="bg-primary rounded-2xl py-4 items-center"
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        >
          <Text className="text-primary-foreground text-base font-bold">
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}