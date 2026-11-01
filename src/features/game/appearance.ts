import { createContext, useContext } from 'react';
const LIGHT_BACKGROUNDS = [
  ['#ffe39b', '#d8f8e9'],
  ['#a9eedb', '#d4e8ff'],
  ['#ffd0a8', '#f7c9e5'],
] as const;
const DARK_BACKGROUNDS = [
  ['#3510A8', '#8317CC'],
  ['#075BC2', '#00A99A'],
  ['#A81372', '#E63978'],
] as const;
export const DARK = {
  dark: true,
  backgrounds: DARK_BACKGROUNDS,
  text: '#FFF9F1',
  muted: '#E0D8FF',
  quiet: '#C8C0F3',
  accent: '#FFD83D',
  accentInk: '#24104F',
  surface: '#4A258F',
  secondary: '#672EB0',
  border: '#ffffff16',
  sheet: '#25104F',
  cards: ['#078C78', '#7628C4', '#B95C0A', '#0871B8'],
  icons: ['#63FFD5', '#E4B5FF', '#FFF06B', '#81E0FF'],
  overlay: '#08051FCE',
  glow: '#FF55E866',
  error: '#64263E',
  errorText: '#FFD0D8',
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
