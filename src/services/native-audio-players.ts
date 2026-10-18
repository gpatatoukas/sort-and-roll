import type { AudioPlayer } from 'expo-audio';
/** Expo AudioPlayer exposes imperative native properties, not React state. */
export function configureNativePlayers(players: Record<string, AudioPlayer>) {
  players.music.loop = true;
  for (const [name, player] of Object.entries(players))
    player.volume = name === 'music' ? 0.27 : name === 'pour' ? 0.48 : name === 'win' ? 0.55 : 0.42;
}
