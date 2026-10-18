import { expect, test } from '@jest/globals';
import { resolveAdUnits } from '../../src/policies/ad-units';
const testIds = {
  banner: 'test-banner',
  rewarded: 'test-rewarded',
  interstitial: 'test-interstitial',
};
const live = {
  mode: 'live',
  banner: 'ca-app-pub-1234567890123456/1234567890',
  rewarded: 'ca-app-pub-1234567890123456/1234567891',
  interstitial: 'ca-app-pub-1234567890123456/1234567892',
};
test('development and explicit test profiles use test units on both mobile platforms', () => {
  expect(resolveAdUnits('android', true, live, testIds)).toBe(testIds);
  expect(resolveAdUnits('ios', true, live, testIds)).toBe(testIds);
  expect(resolveAdUnits('ios', false, { ...live, mode: 'test' }, testIds)).toBe(testIds);
  expect(resolveAdUnits('android', false, { ...live, mode: 'test' }, testIds)).toBe(testIds);
});
test('iOS release uses its own live units and rejects invalid configuration', () => {
  expect(resolveAdUnits('ios', false, live, testIds)).toEqual({
    banner: live.banner,
    rewarded: live.rewarded,
    interstitial: live.interstitial,
  });
  expect(resolveAdUnits('ios', false, { ...live, rewarded: '' }, testIds)).toBeNull();
});
test('Android release uses every configured live placement together', () => {
  expect(resolveAdUnits('android', false, live, testIds)).toEqual({
    banner: live.banner,
    rewarded: live.rewarded,
    interstitial: live.interstitial,
  });
});
test('invalid live configuration disables ads instead of requesting a wrong unit', () => {
  for (const invalid of [
    { ...live, rewarded: '' },
    { ...live, mode: 'typo' },
    { ...live, banner: 'ca-app-pub-3940256099942544/6300978111' },
    { ...live, rewarded: live.banner },
  ])
    expect(resolveAdUnits('android', false, invalid, testIds)).toBeNull();
});

test('browser and missing configuration remain test-only; malformed release values disable ads', () => {
  expect(resolveAdUnits('web', false, live, testIds)).toBe(testIds);
  expect(resolveAdUnits('android', false, null, testIds)).toBe(testIds);
  expect(resolveAdUnits('android', false, 1, testIds)).toBe(testIds);
  expect(resolveAdUnits('android', false, {}, testIds)).toBeNull();
  expect(resolveAdUnits('android', false, { ...live, banner: 4 }, testIds)).toBeNull();
  expect(resolveAdUnits('android', false, { ...live, banner: 'invalid' }, testIds)).toBeNull();
});

test('ad unit identifiers must match the entire string', () => {
  for (const banner of [`prefix${live.banner}`, `${live.banner}suffix`])
    expect(resolveAdUnits('android', false, { ...live, banner }, testIds)).toBeNull();
});
