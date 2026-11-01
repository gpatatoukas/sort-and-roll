import { useEffect, useRef, type RefObject } from 'react';
import { AppState, Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { configureNativePlayers } from '../../services/native-audio-players';
import { AUDIO_ASSETS } from '../../services/audio-assets';
import {
  createAudioController,
  silentAudio,
  type AudioControls,
  type AudioPreferences,
  type Players,
} from '../../services/audio-controller';
export type RuntimeProps = { preferences: AudioPreferences; controlsRef: RefObject<AudioControls> };
export function AudioRuntime({ preferences, controlsRef }: RuntimeProps) {
  const music = useAudioPlayer(AUDIO_ASSETS.music);
  const select = useAudioPlayer(AUDIO_ASSETS.select);
  const pour = useAudioPlayer(AUDIO_ASSETS.pour);
  const settle = useAudioPlayer(AUDIO_ASSETS.settle);
  const bottle = useAudioPlayer(AUDIO_ASSETS.bottle);
  const win = useAudioPlayer(AUDIO_ASSETS.win);
  const tool = useAudioPlayer(AUDIO_ASSETS.tool);
  const invalid = useAudioPlayer(AUDIO_ASSETS.invalid);
  const audioModeReady = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    audioModeReady.current = setAudioModeAsync({
      allowsRecording: false,
      // Android can map this to ringer mode; allow game audio in silent/vibrate.
      playsInSilentMode: Platform.OS === 'android',
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
    void audioModeReady.current.catch(() => undefined);
  }, []);
  useEffect(() => {
    const native = { music, select, pour, settle, bottle, win, tool, invalid };
    configureNativePlayers(native);
    const players = Object.fromEntries(
      Object.entries(native).map(([name, player]) => [
        name,
        {
          play: async () => {
            await audioModeReady.current.catch(() => undefined);
            await player.play();
          },
          pause: () => player.pause(),
          rewind: async () => {
            await audioModeReady.current.catch(() => undefined);
            await player.seekTo(0);
          },
        },
      ]),
    ) as Players;
    const controller = createAudioController(players, { music: false, sfx: false });
    controlsRef.current = controller;
    controller.setActive(AppState.currentState === 'active');
    const listener = AppState.addEventListener('change', (state) =>
      controller.setActive(state === 'active'),
    );
    return () => {
      listener.remove();
      controller.dispose();
      controlsRef.current = silentAudio;
    };
  }, [music, select, pour, settle, bottle, win, tool, invalid, controlsRef]);
  useEffect(() => {
    controlsRef.current.configure(preferences);
  }, [preferences, controlsRef]);
  return null;
}
