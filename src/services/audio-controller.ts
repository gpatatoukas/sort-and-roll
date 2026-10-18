export type Sound = 'select' | 'pour' | 'settle' | 'bottle' | 'win' | 'tool' | 'invalid';
export type AudioPreferences = { music: boolean; sfx: boolean };
export type Player = {
  play: () => void | Promise<void>;
  pause: () => void;
  rewind: () => Promise<void>;
};
export type Players = Record<Sound | 'music', Player>;
export type AudioControls = {
  activate: () => void;
  configure: (preferences: AudioPreferences) => void;
  cue: (sound: Sound) => void;
  setActive: (active: boolean) => void;
  dispose: () => void;
};
export const silentAudio: AudioControls = {
  activate() {},
  configure() {},
  cue() {},
  setActive() {},
  dispose() {},
};
/** Owns playback eligibility and cancels stale asynchronous rewinds after mute/background. */
export function createAudioController(players: Players, initial: AudioPreferences): AudioControls {
  let preferences = initial,
    active = true,
    started = false,
    disposed = false;
  let epoch = 0;
  const requests = new Map<Sound, number>();
  const safely = (operation: () => void | Promise<void>) => {
    try {
      void Promise.resolve(operation()).catch(() => undefined);
    } catch {
      /* Unavailable output never blocks play. */
    }
  };
  function syncMusic() {
    if (!disposed && active && started && preferences.music) safely(() => players.music.play());
    else safely(() => players.music.pause());
  }
  function stopEffects() {
    epoch++;
    for (const [name, player] of Object.entries(players))
      if (name !== 'music') safely(() => player.pause());
  }
  return {
    activate() {
      if (disposed) return;
      started = true;
      syncMusic();
    },
    configure(next) {
      preferences = { ...next };
      if (!next.sfx) stopEffects();
      syncMusic();
    },
    cue(sound) {
      if (disposed || !active || !preferences.sfx) return;
      const issued = epoch,
        request = (requests.get(sound) ?? 0) + 1;
      requests.set(sound, request);
      safely(async () => {
        await players[sound].rewind();
        if (
          !disposed &&
          active &&
          preferences.sfx &&
          issued === epoch &&
          requests.get(sound) === request
        )
          await players[sound].play();
      });
    },
    setActive(next) {
      active = next;
      if (!active) stopEffects();
      syncMusic();
    },
    dispose() {
      disposed = true;
      stopEffects();
      safely(() => players.music.pause());
    },
  };
}
