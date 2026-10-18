import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, Platform, View } from 'react-native';
import { silentAudio, type AudioControls, type Sound } from '../../services/audio-controller';
import { cancelHaptics, hapticCue } from '../../services/haptics';
import { AudioRuntime } from './audio-runtime';
type Preferences = { music: boolean; sfx: boolean; vibration: boolean };
const defaults: Preferences = { music: true, sfx: true, vibration: true };
const FeedbackContext = createContext({
  configure: (_preferences: Preferences) => {},
  cue: (_sound: Sound) => {},
  suspend: (_value: boolean) => {},
});
export const useFeedback = () => useContext(FeedbackContext);
export function FeedbackProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState(defaults);
  const latest = useRef(defaults);
  const suspended = useRef(false);
  const controls = useRef<AudioControls>(silentAudio);
  const feedback = useMemo(
    () => ({
      configure(next: Preferences) {
        latest.current = next;
        controls.current.configure(suspended.current ? { music: false, sfx: false } : next);
        if (Platform.OS !== 'web') controls.current.activate();
        if (!next.vibration) cancelHaptics();
        setPreferences((previous) =>
          previous.music === next.music &&
          previous.sfx === next.sfx &&
          previous.vibration === next.vibration
            ? previous
            : suspended.current
              ? { ...next, music: false, sfx: false }
              : { ...next },
        );
      },
      suspend(value: boolean) {
        suspended.current = value;
        const next = value ? { ...latest.current, music: false, sfx: false } : latest.current;
        controls.current.configure(next);
        setPreferences(next);
        if (value) cancelHaptics();
      },
      cue(sound: Sound) {
        if (suspended.current) return;
        controls.current.cue(sound);
        hapticCue(sound, latest.current.vibration);
      },
    }),
    [],
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') cancelHaptics();
    });
    return () => {
      listener.remove();
      cancelHaptics();
    };
  }, []);
  return (
    <FeedbackContext.Provider value={feedback}>
      <AudioRuntime preferences={preferences} controlsRef={controls} />
      <View
        style={{ flex: 1 }}
        onPointerDown={() => controls.current.activate()}
        onTouchStart={() => controls.current.activate()}
      >
        {children}
      </View>
    </FeedbackContext.Provider>
  );
}
