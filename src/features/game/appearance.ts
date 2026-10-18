import { createContext, useContext } from 'react';
const LIGHT_BACKGROUNDS = [
  ['#fbf5ee', '#ede8fb'],
  ['#edf8f4', '#cfede3'],
  ['#fdf2e5', '#ffe4d8'],
] as const;
const DARK_BACKGROUNDS = [
  ['#111728', '#211b38'],
  ['#101f25', '#152e32'],
  ['#241b2d', '#332237'],
] as const;
export const DARK = {
  dark: true,
  backgrounds: DARK_BACKGROUNDS,
  text: '#f3edff',
  muted: '#b9afcc',
  quiet: '#9189a8',
  accent: '#c3a3ff',
  accentInk: '#211531',
  surface: '#24253d',
  secondary: '#35304b',
  border: '#ffffff16',
  sheet: '#242137',
  cards: ['#1c3334', '#302840', '#393126', '#213248'],
  icons: ['#85d9bd', '#c1a1fa', '#f0cd7f', '#91bdf7'],
  overlay: '#070a16bd',
  glow: '#bd9cf433',
  error: '#492e38',
  errorText: '#ffc1b8',
  glass: '#8494b01a',
  glassEdge: '#b6c9e891',
  glassHighlight: '#e1eeffcf',
  neck: '#829ac530',
  collar: '#c2ad8199',
  reflection: '#e0ecff36',
  shade: '#070a1d55',
  hidden: '#6b6889',
};
export type Palette = Omit<typeof DARK, 'dark' | 'backgrounds'> & {
  dark: boolean;
  backgrounds: readonly (readonly [string, string])[];
};
export const LIGHT: Palette = {
  dark: false,
  backgrounds: LIGHT_BACKGROUNDS,
  text: '#574363',
  muted: '#7e6c90',
  quiet: '#8d7c9d',
  accent: '#9573c8',
  accentInk: '#ffffff',
  surface: '#ffffff90',
  secondary: '#eee5f6',
  border: '#ffffff',
  sheet: '#fbf7fe',
  cards: ['#edf9ef', '#f2edff', '#fff5da', '#e8f3ff'],
  icons: ['#5e9987', '#9c79cf', '#bc8e31', '#6998c3'],
  overlay: '#41324d66',
  glow: '#ab86dc30',
  error: '#ffe2db',
  errorText: '#973a29',
  glass: '#ffffff4d',
  glassEdge: '#ffffffed',
  glassHighlight: '#ffffff',
  neck: '#ffffff70',
  collar: '#b59a6f91',
  reflection: '#ffffff8c',
  shade: '#84739524',
  hidden: '#a49bb6',
};
export const AppearanceContext = createContext<Palette>(DARK);
export const useAppearance = () => useContext(AppearanceContext);
