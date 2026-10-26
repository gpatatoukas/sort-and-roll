import { createContext, useContext } from 'react';
const LIGHT_BACKGROUNDS = [
  ['#ffe39b', '#d8f8e9'],
  ['#a9eedb', '#d4e8ff'],
  ['#ffd0a8', '#f7c9e5'],
] as const;
const DARK_BACKGROUNDS = [
  ['#092c42', '#07534e'],
  ['#102d58', '#3a2868'],
  ['#542b47', '#773d3e'],
] as const;
export const DARK = {
  dark: true,
  backgrounds: DARK_BACKGROUNDS,
  text: '#fff8e9',
  muted: '#d0c6f2',
  quiet: '#b4b5d4',
  accent: '#ffc247',
  accentInk: '#29234c',
  surface: '#10485a',
  secondary: '#343064',
  border: '#ffffff16',
  sheet: '#242047',
  cards: ['#10594f', '#44336c', '#654222', '#17466b'],
  icons: ['#51f0c8', '#d0adff', '#ffd56a', '#89c6ff'],
  overlay: '#070a16bd',
  glow: '#4aebc944',
  error: '#492e38',
  errorText: '#ffc1b8',
  glass: '#8494b01a',
  glassEdge: '#b6c9e891',
  glassHighlight: '#e1eeffcf',
  neck: '#829ac530',
  collar: '#c2ad8199',
  reflection: '#e0ecff36',
  shade: '#070a1d55',
  hidden: '#8986b1',
};
export type Palette = Omit<typeof DARK, 'dark' | 'backgrounds'> & {
  dark: boolean;
  backgrounds: readonly (readonly [string, string])[];
};
export const LIGHT: Palette = {
  dark: false,
  backgrounds: LIGHT_BACKGROUNDS,
  text: '#20304d',
  muted: '#526483',
  quiet: '#687895',
  accent: '#ef5b35',
  accentInk: '#ffffff',
  surface: '#ffffffd9',
  secondary: '#dce7fa',
  border: '#ffffff',
  sheet: '#fff8e9',
  cards: ['#b9f1d3', '#dfd0ff', '#ffe19b', '#c9e4ff'],
  icons: ['#087c68', '#7042bf', '#a86608', '#2168b4'],
  overlay: '#41324d66',
  glow: '#ff8a4545',
  error: '#ffe2db',
  errorText: '#973a29',
  glass: '#ffffff4d',
  glassEdge: '#ffffffed',
  glassHighlight: '#ffffff',
  neck: '#ffffff70',
  collar: '#b59a6f91',
  reflection: '#ffffff8c',
  shade: '#84739524',
  hidden: '#71809b',
};
export const AppearanceContext = createContext<Palette>(DARK);
export const useAppearance = () => useContext(AppearanceContext);
