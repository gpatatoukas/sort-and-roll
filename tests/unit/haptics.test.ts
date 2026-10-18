import { describe, expect, jest, test } from '@jest/globals';
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: { currentState: 'active' },
  Vibration: { vibrate: jest.fn(), cancel: jest.fn() },
}));
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  impactAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  notificationAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Soft: 'soft' },
  NotificationFeedbackType: { Success: 'success' },
}));
import { AppState, Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cancelHaptics, hapticCue } from '../../src/services/haptics';
describe('soft haptics', () => {
  test('Android uses distinct gentle patterns and respects mute/background', () => {
    hapticCue('select', true);
    expect(Vibration.vibrate).toHaveBeenLastCalledWith(7);
    hapticCue('pour', true);
    expect(Vibration.vibrate).toHaveBeenLastCalledWith(12);
    hapticCue('bottle', true);
    expect(Vibration.vibrate).toHaveBeenLastCalledWith([0, 10, 65, 16]);
    hapticCue('win', true);
    expect(Vibration.vibrate).toHaveBeenLastCalledWith([0, 12, 65, 18, 95, 24]);
    jest.mocked(Vibration.vibrate).mockClear();
    hapticCue('win', false);
    expect(Vibration.vibrate).not.toHaveBeenCalled();
    Object.defineProperty(AppState, 'currentState', { value: 'background', configurable: true });
    hapticCue('win', true);
    expect(Vibration.vibrate).not.toHaveBeenCalled();
    cancelHaptics();
    expect(Vibration.cancel).toHaveBeenCalled();
  });
  test('iOS uses selection, soft impact and success; web is silent', () => {
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    hapticCue('select', true);
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    hapticCue('pour', true);
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith(Haptics.ImpactFeedbackStyle.Soft);
    hapticCue('win', true);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
    jest.mocked(Haptics.impactAsync).mockClear();
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    hapticCue('pour', true);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
