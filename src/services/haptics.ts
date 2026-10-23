import { AppState, Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Sound } from './audio-controller';
/** Quiet droplet-like taps; deliberately distinct from Block and Roll's heavy bursts. */
export function hapticCue(sound: Sound, enabled: boolean) {
  if (!enabled || Platform.OS === 'web' || AppState.currentState !== 'active') return;
  if (Platform.OS === 'android') {
    const pattern =
      sound === 'win'
        ? [0, 8, 75, 12, 110, 16]
        : sound === 'bottle'
          ? [0, 7, 80, 11]
          : sound === 'pour'
            ? 8
            : sound === 'invalid'
              ? 5
              : 5;
    Vibration.vibrate(pattern);
    return;
  }
  const operation =
    sound === 'select'
      ? Haptics.selectionAsync()
      : sound === 'win'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(
            sound === 'bottle'
              ? Haptics.ImpactFeedbackStyle.Light
              : Haptics.ImpactFeedbackStyle.Soft,
          );
  void operation.catch(() => undefined);
}
export function cancelHaptics() {
  if (Platform.OS === 'android') Vibration.cancel();
}
