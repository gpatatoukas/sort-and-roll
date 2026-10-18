import { describe, expect, jest, test } from '@jest/globals';
import {
  createAudioController,
  type Players,
  type Sound,
} from '../../src/services/audio-controller';
const names = ['select', 'pour', 'settle', 'bottle', 'win', 'tool', 'invalid'] as Sound[];
function setup() {
  const fake = () => ({
    play: jest.fn<() => void>(),
    pause: jest.fn<() => void>(),
    rewind: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  });
  const players = {
    music: fake(),
    select: fake(),
    pour: fake(),
    settle: fake(),
    bottle: fake(),
    win: fake(),
    tool: fake(),
    invalid: fake(),
  } satisfies Players;
  return { players, controller: createAudioController(players, { music: true, sfx: true }) };
}
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
describe('audio lifecycle', () => {
  test('music starts after activation, mutes immediately and resumes only in foreground', () => {
    const { players, controller } = setup();
    controller.configure({ music: true, sfx: true });
    expect(players.music.play).not.toHaveBeenCalled();
    controller.activate();
    expect(players.music.play).toHaveBeenCalledTimes(1);
    controller.configure({ music: false, sfx: true });
    expect(players.music.pause).toHaveBeenCalled();
    controller.activate();
    expect(players.music.play).toHaveBeenCalledTimes(1);
    controller.setActive(false);
    controller.configure({ music: true, sfx: true });
    expect(players.music.play).toHaveBeenCalledTimes(1);
    controller.setActive(true);
    expect(players.music.play).toHaveBeenCalledTimes(2);
  });
  test('every effect is replayable and turning off effects stops all of them', async () => {
    const { players, controller } = setup();
    for (const name of names) controller.cue(name);
    await flush();
    for (const name of names) expect(players[name].play).toHaveBeenCalledTimes(1);
    controller.configure({ music: true, sfx: false });
    for (const name of names) {
      expect(players[name].pause).toHaveBeenCalled();
      controller.cue(name);
    }
    await flush();
    for (const name of names) expect(players[name].play).toHaveBeenCalledTimes(1);
  });
  test.each(['mute', 'background', 'dispose'] as const)(
    'late seek cannot restart a sound after %s',
    async (action) => {
      const { players, controller } = setup();
      let finish: () => void = () => undefined;
      jest.mocked(players.pour.rewind).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      );
      controller.cue('pour');
      if (action === 'mute') controller.configure({ music: true, sfx: false });
      if (action === 'background') controller.setActive(false);
      if (action === 'dispose') controller.dispose();
      finish();
      await flush();
      expect(players.pour.play).not.toHaveBeenCalled();
    },
  );
  test('repeated seeks only play the latest request and output failures stay contained', async () => {
    const { players, controller } = setup();
    controller.cue('select');
    controller.cue('select');
    await flush();
    expect(players.select.play).toHaveBeenCalledTimes(1);
    jest.mocked(players.win.rewind).mockRejectedValueOnce(new Error('unavailable'));
    controller.cue('win');
    await flush();
    jest.mocked(players.music.play).mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => controller.activate()).not.toThrow();
    controller.dispose();
    controller.activate();
    controller.cue('select');
    await flush();
    expect(players.select.play).toHaveBeenCalledTimes(1);
  });
});
