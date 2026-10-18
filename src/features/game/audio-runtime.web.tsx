import { useEffect } from 'react';
import { Asset } from 'expo-asset';
import { AUDIO_ASSETS } from '../../services/audio-assets';
import { createAudioController, silentAudio, type Players } from '../../services/audio-controller';
import type { RuntimeProps } from './audio-runtime';
export function AudioRuntime({ preferences, controlsRef }: RuntimeProps) {
  useEffect(() => {
    const elements = Object.fromEntries(
      Object.entries(AUDIO_ASSETS).map(([name, asset]) => {
        const player = new Audio(Asset.fromModule(asset).uri);
        player.preload = 'auto';
        player.loop = name === 'music';
        player.volume =
          name === 'music' ? 0.27 : name === 'pour' ? 0.48 : name === 'win' ? 0.55 : 0.42;
        return [name, player];
      }),
    );
    const players = Object.fromEntries(
      Object.entries(elements).map(([name, player]) => [
        name,
        {
          play: () => player.play(),
          pause: () => player.pause(),
          rewind: async () => {
            player.currentTime = 0;
          },
        },
      ]),
    ) as Players;
    const controller = createAudioController(players, { music: false, sfx: false });
    controlsRef.current = controller;
    const visibility = () => controller.setActive(!document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      controller.dispose();
      for (const player of Object.values(elements)) {
        player.removeAttribute('src');
        player.load();
      }
      controlsRef.current = silentAudio;
    };
  }, [controlsRef]);
  useEffect(() => {
    controlsRef.current.configure(preferences);
  }, [preferences, controlsRef]);
  return null;
}
