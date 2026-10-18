import { AdsProvider } from '../features/game/ads';
import { FeedbackProvider } from '../features/game/feedback-provider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
export default function Layout() {
  return (
    <FeedbackProvider>
      <AdsProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#111728' } }}
        />
      </AdsProvider>
    </FeedbackProvider>
  );
}
