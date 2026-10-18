import { COSMETIC_PREVIEW } from '../../src/config/preview';
import { expect, test, type Page } from '@playwright/test';
import { createGame, dateKey, weekKey } from '../../src/engine/game';
async function fixture(
  page: Page,
  mode: 'daily' | 'relaxed' | 'weekly' = 'relaxed',
  level = 1,
  custom?: number[][],
  completed = 9,
) {
  const game = createGame(mode, level, 42);
  if (custom) {
    game.board = custom.map((water) => ({ water, hidden: [], lock: null }));
    game.initial = game.board;
    game.solution = [];
  }
  const today = new Date();
  const progress = {
    version: 1,
    onboarded: true,
    identity: 'browser-tests',
    day: dateKey(today),
    week: weekKey(today),
    dailyDone: false,
    streak: 0,
    lastDaily: '',
    completed,
    weeklyLevel: level,
    levels: { relaxed: level, challenge: 1 },
    games: { [mode]: game },
    inventory: { undo: 3, hint: 3, bottle: 2, reveal: 2, remove: 1 },
    vibration: false,
    theme: 0,
    shape: 0,
  };
  await page.addInitScript((p) => {
    if (!localStorage.getItem('test-seeded')) {
      localStorage.setItem('sort-and-roll/progress/v1', JSON.stringify(p));
      localStorage.setItem('test-seeded', '1');
    }
  }, progress);
  return game;
}
async function noScroll(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1),
  ).toBe(true);
}
async function stored(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('sort-and-roll/progress/v1') ?? '{}'));
}
test('real taps sort a puzzle, award tenth-level gift, advance and restore', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const game = await fixture(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Take it easy', exact: true }).click();
  await expect(page.getByText('Level 01')).toBeVisible();
  await noScroll(page);
  for (const [a, b] of game.solution) {
    const label = await page.getByTestId(`bottle-${a}`).getAttribute('aria-label');
    await page.getByTestId(`bottle-${a}`).click();
    await page.getByTestId(`bottle-${b}`).click();
    await expect(page.getByTestId(`bottle-${a}`)).not.toHaveAttribute('aria-label', label!);
  }
  await expect(page.getByText('Beautifully sorted.')).toBeVisible();
  await expect.poll(async () => (await stored(page)).completed).toBe(10);
  const p = await stored(page);
  expect(Object.values(p.inventory).reduce((a: number, b) => a + Number(b), 0)).toBe(12);
  await page.getByRole('button', { name: 'One more little pour' }).click();
  await expect(page.getByText('Level 02')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Level 02')).toBeVisible();
  expect(errors).toEqual([]);
});
test('daily restarts without leaving, completion disables menu and survives reload', async ({
  page,
}) => {
  const game = await fixture(page, 'daily', 25);
  await page.goto('/?mode=daily');
  await expect(page.getByText('Your daily drop')).toBeVisible();
  const move = game.solution[0];
  const before = await page.getByTestId(`bottle-${move[0]}`).getAttribute('aria-label');
  await page.getByTestId(`bottle-${move[0]}`).click();
  await page.getByTestId(`bottle-${move[1]}`).click();
  await expect(page.getByTestId(`bottle-${move[0]}`)).not.toHaveAttribute('aria-label', before!);
  await page.getByRole('button', { name: 'Restart puzzle' }).click();
  await expect(page.getByTestId(`bottle-${move[0]}`)).toHaveAttribute('aria-label', before!);
  for (const [a, b] of game.solution) {
    const label = await page.getByTestId(`bottle-${a}`).getAttribute('aria-label');
    await page.getByTestId(`bottle-${a}`).click();
    await page.getByTestId(`bottle-${b}`).click();
    await expect(page.getByTestId(`bottle-${a}`)).not.toHaveAttribute('aria-label', label!);
  }
  await expect(page.getByText('Beautifully sorted.')).toBeVisible();
  await page.getByRole('button', { name: 'Lovely. Back home' }).click();
  await expect(page.getByRole('button', { name: 'Daily drop', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Daily drop', exact: true })).toBeDisabled();
});
test('small phone, tools, mode preservation and cosmetic settings', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const game = await fixture(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Take it easy', exact: true }).waitFor();
  await noScroll(page);
  await page.getByRole('button', { name: 'Take it easy', exact: true }).click();
  await expect(page.getByText('Level 01')).toBeVisible();
  await noScroll(page);
  await page.getByRole('button', { name: 'Hint, 3 remaining' }).click();
  await expect(
    page.getByText(
      `Pour bottle ${game.solution[0][0] + 1} into bottle ${game.solution[0][1] + 1}.`,
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Extra bottle, 2 remaining' }).click();
  await expect(page.getByTestId(`bottle-${game.board.length}`)).toBeVisible();
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await page.getByRole('button', { name: 'A little challenge', exact: true }).click();
  await expect(page.getByText('Level 01')).toBeVisible();
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await page.getByRole('button', { name: 'Take it easy', exact: true }).click();
  await expect(page.getByTestId(`bottle-${game.board.length}`)).toBeVisible();
});

test('first-use tool introduction is dismissible and remembered', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Take it easy', exact: true }).click();
  await expect(page.getByText('A little helping hand')).toBeVisible();
  const continueBox = (await page
    .getByRole('button', { name: 'Got it', exact: true })
    .boundingBox())!;
  expect(continueBox.y + continueBox.height).toBeLessThanOrEqual(568);
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await expect(page.getByText('A little helping hand')).not.toBeVisible();
  await expect.poll(async () => (await stored(page)).onboarded).toBe(true);
  await page.reload();
  await expect(page.getByText('Level 01')).toBeVisible();
  await expect(page.getByText('A little helping hand')).not.toBeVisible();
});

for (const [label, from, to, sign] of [
  ['right', 0, 2, 1],
  ['left', 2, 0, -1],
  ['next row', 0, 4, 1],
] as const) {
  test(`bottle flies above target and tilts ${label}`, async ({ page }) => {
    await fixture(page, 'relaxed', 1, [[1, 2], [2, 1], [2], [1], [1, 2], []]);
    await page.goto('/?mode=relaxed');
    const source = page.getByTestId(`bottle-${from}`),
      target = page.getByTestId(`bottle-${to}`);
    await source.click();
    await target.click();
    const overlay = page.getByTestId('pour-overlay'),
      stream = page.getByTestId('pour-stream');
    await expect(overlay).toBeVisible();
    await expect
      .poll(() => stream.evaluate((el) => Number(getComputedStyle(el).opacity)), {
        intervals: [16],
      })
      .toBeGreaterThan(0.96);
    const rotation = await overlay.evaluate((el) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return (Math.atan2(m.b, m.a) * 180) / Math.PI;
    });
    expect(rotation * sign).toBeGreaterThan(60);
    const a = (await stream.boundingBox())!,
      b = (await target.boundingBox())!;
    // RN rounds layout coordinates to device pixels; allow one CSS pixel.
    expect(Math.abs(a.x + a.width / 2 - (b.x + b.width / 2))).toBeLessThanOrEqual(1);
    expect(Math.abs(a.y + a.height - (b.y + 25))).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `/tmp/sort-roll-pour-${label.replace(' ', '-')}.png` });
    await expect(overlay).toHaveCount(0);
  });
}

test('dark default, complete light theme and saved appearance across menu and play', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/');
  const lightToggle = page.getByRole('button', { name: 'Switch to light theme' });
  await expect(lightToggle).toBeVisible();
  const background = page.getByTestId('app-background');
  const darkBackground = await background.evaluate((el) => getComputedStyle(el).backgroundImage);
  await page.screenshot({ path: '/tmp/sort-roll-dark-home.png' });
  await lightToggle.click();
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
  await expect
    .poll(() => background.evaluate((el) => getComputedStyle(el).backgroundImage))
    .not.toBe(darkBackground);
  await expect.poll(async () => (await stored(page)).appearance).toBe('light');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
  await page.screenshot({ path: '/tmp/sort-roll-light-home.png' });
  await page.getByRole('button', { name: 'Take it easy', exact: true }).click();
  await expect(page.getByTestId('bottle-0')).toBeVisible();
  await page.screenshot({ path: '/tmp/sort-roll-light-bottles.png' });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  await expect.poll(async () => (await stored(page)).appearance).toBe('dark');
  await page.screenshot({ path: '/tmp/sort-roll-dark-bottles.png' });
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  await page.getByRole('button', { name: 'Make it yours' }).click();
  await expect(page.getByText('Bottle shapes', { exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/sort-roll-dark-closet.png' });
});

declare global {
  interface Window {
    __sortAudio: HTMLMediaElement[];
    __sortPlays: string[];
  }
}
test('music and liquid effects play, mute independently and settings persist', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__sortAudio = [];
    window.__sortPlays = [];
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (!window.__sortAudio.includes(this)) window.__sortAudio.push(this);
      window.__sortPlays.push(this.src);
      return original.call(this);
    };
  });
  const game = await fixture(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__sortAudio.some(
          (a) => a.src.includes('tideglass') && !a.paused && a.readyState >= 2,
        ),
      ),
    )
    .toBe(true);
  await page.getByRole('switch', { name: 'Music', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => window.__sortAudio.find((a) => a.src.includes('tideglass'))?.paused),
    )
    .toBe(true);
  await page.getByRole('switch', { name: 'Sound effects', exact: true }).click();
  await page.getByRole('switch', { name: 'Vibration', exact: true }).check();
  await page.getByRole('switch', { name: 'Vibration', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.getByRole('button', { name: 'Take it easy', exact: true }).click();
  const count = await page.evaluate(() => window.__sortPlays.length);
  await page.getByTestId('bottle-0').click();
  expect(await page.evaluate(() => window.__sortPlays.length)).toBe(count);
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('switch', { name: 'Sound effects', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__sortAudio.some((a) => a.src.includes('select') && a.currentTime > 0 && !a.error),
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.getByRole('button', { name: 'Take it easy', exact: true }).click();
  const [a, b] = game.solution[0];
  await page.getByTestId(`bottle-${a}`).click();
  await page.getByTestId(`bottle-${b}`).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__sortAudio.some((a) => a.src.includes('/pour.') && a.currentTime > 0 && !a.error),
      ),
    )
    .toBe(true);
  await expect.poll(async () => (await stored(page)).games.relaxed.moves).toBe(1);
  await page.reload();
  const saved = await stored(page);
  expect(saved.music).toBe(false);
  expect(saved.sfx).toBe(true);
  expect(saved.vibration).toBe(false);
  expect(errors).toEqual([]);
});

test('seasonal collection previews, milestone locks and selected scene survive reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await fixture(page, 'relaxed', 1, undefined, 80);
  await page.goto('/');
  await page.getByRole('button', { name: 'Make it yours' }).click();
  await page.getByRole('button', { name: 'Browse backgrounds' }).click();
  await page.getByRole('button', { name: 'Next backgrounds', exact: true }).click();
  const halloween = page.getByRole('button', { name: 'Haunted Hollow, unlocked', exact: true });
  await expect(halloween).toBeEnabled();
  await halloween.click();
  await expect.poll(async () => (await stored(page)).theme).toBe(5);
  await expect(page.getByText('HALLOWEEN', { exact: true })).toBeVisible();
  const christmas = page.getByRole('button', { name: 'Christmas Glow, unlocked', exact: true });
  await expect(christmas).toBeEnabled();
  await christmas.click();
  await expect.poll(async () => (await stored(page)).theme).toBe(7);
  const collectionBack = (await page
    .getByRole('button', { name: 'Back to collection', exact: true })
    .boundingBox())!;
  expect(collectionBack.y + collectionBack.height).toBeLessThanOrEqual(568);
  await page.screenshot({ path: '/tmp/sort-roll-seasonal-gallery.png' });
  await page.getByRole('button', { name: 'Next backgrounds', exact: true }).click();
  await page.getByRole('button', { name: 'Next backgrounds', exact: true }).click();
  const galaxy = page.getByRole('button', {
    name: COSMETIC_PREVIEW ? 'Midnight Galaxy, unlocked' : 'Midnight Galaxy, unlock at 365 levels',
    exact: true,
  });
  if (COSMETIC_PREVIEW) await expect(galaxy).toBeEnabled();
  else await expect(galaxy).toBeDisabled();
  await page.getByRole('button', { name: 'Back to collection', exact: true }).click();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.reload();
  await expect.poll(async () => (await stored(page)).theme).toBe(7);
  await page.getByRole('button', { name: 'Take it easy', exact: true }).click();
  await expect(page.getByTestId('bottle-0')).toBeVisible();
  await page.screenshot({ path: '/tmp/sort-roll-christmas-game.png' });
});

test('depleted power opens no reward sheet and unavailable web ads grant nothing', async ({
  page,
}) => {
  await fixture(page);
  await page.addInitScript(() => {
    const raw = localStorage.getItem('sort-and-roll/progress/v1');
    if (raw) {
      const p = JSON.parse(raw);
      p.inventory.undo = 0;
      localStorage.setItem('sort-and-roll/progress/v1', JSON.stringify(p));
    }
  });
  await page.goto('/?mode=relaxed');
  const control = page.getByRole('button', {
    name: 'Undo, 0 remaining, watch ad for one charge',
    exact: true,
  });
  await control.click();
  await expect(
    page.getByText('Ad not ready or not completed. No charge added; try again shortly.'),
  ).toBeVisible();
  await expect(page.getByText('Got it', { exact: true })).toHaveCount(0);
  expect((await stored(page)).inventory.undo).toBe(0);
  await noScroll(page);
});

test('liquid drains and fills progressively before the move commits', async ({ page }) => {
  await fixture(page, 'relaxed', 1, [[1, 2, 2], [2], [1], []], 0);
  await page.goto('/?mode=relaxed');
  await page.getByTestId('bottle-0').click();
  await page.getByTestId('bottle-1').click();
  const filling = page.getByTestId('bottle-1').getByTestId('liquid-layer-1');
  const draining = page.getByTestId('pour-overlay').getByTestId('liquid-layer-2');
  const scale = (locator: ReturnType<Page['getByTestId']>) =>
    locator.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).d);
  await expect
    .poll(
      async () => {
        const amount = await scale(filling);
        return amount > 0.2 && amount < 0.85;
      },
      { intervals: [16] },
    )
    .toBe(true);
  const poured = await scale(filling);
  expect(poured).toBeGreaterThan(0);
  expect(poured).toBeLessThan(1);
  expect(await scale(draining)).toBeLessThan(1);
  expect((await stored(page)).games.relaxed.moves).toBe(0);
  await expect(page.getByTestId('pour-inner-stream')).toBeVisible();
  await expect(page.getByTestId('pour-ripple')).toBeVisible();
  await page.screenshot({ path: '/tmp/sort-roll-liquid-mid-pour.png' });
  await expect.poll(() => scale(filling), { intervals: [16] }).toBeGreaterThan(0.98);
  await expect(page.getByTestId('pour-overlay')).toHaveCount(0);
  await expect.poll(async () => (await stored(page)).games.relaxed.moves).toBe(1);
  expect((await stored(page)).games.relaxed.board[0].water).toEqual([1]);
  expect((await stored(page)).games.relaxed.board[1].water).toEqual([2, 2, 2]);
});

test('reduced motion transfers liquid immediately without a flying bottle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixture(page, 'relaxed', 1, [[1, 2, 2], [2], [1], []], 0);
  await page.goto('/?mode=relaxed');
  await page.getByTestId('bottle-0').click();
  await page.getByTestId('bottle-1').click();
  await expect(page.getByTestId('pour-overlay')).toHaveCount(0);
  await expect.poll(async () => (await stored(page)).games.relaxed.moves).toBe(1);
  expect((await stored(page)).games.relaxed.board[1].water).toEqual([2, 2, 2]);
});
