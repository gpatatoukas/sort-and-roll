export type Scene =
  | 'studio'
  | 'lagoon'
  | 'sunset'
  | 'garden'
  | 'blossom'
  | 'halloween'
  | 'forest'
  | 'christmas'
  | 'reef'
  | 'autumn'
  | 'aurora'
  | 'lantern'
  | 'lavender'
  | 'carnival'
  | 'starfall'
  | 'galaxy';
export type Background = {
  id: Scene;
  name: string;
  unlockAt: number;
  season?: string;
  dark: readonly [string, string];
  light: readonly [string, string];
  ink: string;
  detail: string;
};
export const BACKGROUNDS: readonly Background[] = [
  {
    id: 'studio',
    name: 'Moonlit Studio',
    unlockAt: 0,
    dark: ['#3510A8', '#8317CC'],
    light: ['#ffe39b', '#d8f8e9'],
    ink: '#45F0C3',
    detail: '#FFD83D',
  },
  {
    id: 'lagoon',
    name: 'Jade Lagoon',
    unlockAt: 5,
    dark: ['#075BC2', '#00A99A'],
    light: ['#e6f7ef', '#bce8dd'],
    ink: '#3CE6C2',
    detail: '#64D7FF',
  },
  {
    id: 'sunset',
    name: 'Peach Solstice',
    unlockAt: 10,
    season: 'Summer',
    dark: ['#A81372', '#E63978'],
    light: ['#fff3d7', '#f4c8bc'],
    ink: '#FFB547',
    detail: '#FF7AAE',
  },
  {
    id: 'garden',
    name: 'Cloud Garden',
    unlockAt: 15,
    dark: ['#2352C9', '#5479E8'],
    light: ['#edf5ff', '#dce7fa'],
    ink: '#71C9FF',
    detail: '#FFE071',
  },
  {
    id: 'blossom',
    name: 'Sakura Wish',
    unlockAt: 25,
    season: 'Spring',
    dark: ['#8D21B5', '#D63C9F'],
    light: ['#fff0f6', '#efd4e5'],
    ink: '#FF71B8',
    detail: '#FFD76E',
  },
  {
    id: 'halloween',
    name: 'Haunted Hollow',
    unlockAt: 40,
    season: 'Halloween',
    dark: ['#5520A1', '#B52A78'],
    light: ['#f3e7f6', '#efceaf'],
    ink: '#FF9C3D',
    detail: '#D3A0FF',
  },
  {
    id: 'forest',
    name: 'Firefly Grove',
    unlockAt: 60,
    dark: ['#087D5F', '#16A86E'],
    light: ['#e8f1db', '#c3dec7'],
    ink: '#39E2AA',
    detail: '#FFE267',
  },
  {
    id: 'christmas',
    name: 'Christmas Glow',
    unlockAt: 80,
    season: 'Christmas',
    dark: ['#A31C55', '#D7354F'],
    light: ['#fff2df', '#efc9c7'],
    ink: '#43E1B1',
    detail: '#FFD269',
  },
  {
    id: 'reef',
    name: 'Coral Daydream',
    unlockAt: 100,
    dark: ['#1764CC', '#00A5B8'],
    light: ['#dff8fb', '#badfe9'],
    ink: '#FF759A',
    detail: '#43E7D1',
  },
  {
    id: 'autumn',
    name: 'Amber Orchard',
    unlockAt: 125,
    season: 'Autumn',
    dark: ['#A54E13', '#D66A27'],
    light: ['#fff3de', '#ead6b6'],
    ink: '#FFC247',
    detail: '#FF7B4D',
  },
  {
    id: 'aurora',
    name: 'Winter Aurora',
    unlockAt: 150,
    season: 'Winter',
    dark: ['#2B5AC7', '#00A99A'],
    light: ['#eaf6fa', '#cddfe9'],
    ink: '#52F0CE',
    detail: '#C89AFF',
  },
  {
    id: 'lantern',
    name: 'Lantern Wishes',
    unlockAt: 175,
    season: 'Lunar New Year',
    dark: ['#A31D48', '#D93238'],
    light: ['#fff0e2', '#f0d4c4'],
    ink: '#FF765F',
    detail: '#FFD260',
  },
  {
    id: 'lavender',
    name: 'Lavender Haze',
    unlockAt: 200,
    dark: ['#5030B8', '#8754D5'],
    light: ['#f5efff', '#dfd4ed'],
    ink: '#C99AFF',
    detail: '#51E2B4',
  },
  {
    id: 'carnival',
    name: 'Summer Carnival',
    unlockAt: 250,
    season: 'Summer',
    dark: ['#6337BE', '#B344B8'],
    light: ['#fff3e2', '#e5dff7'],
    ink: '#FFC15A',
    detail: '#D09AFF',
  },
  {
    id: 'starfall',
    name: 'Meteor Shower',
    unlockAt: 300,
    dark: ['#2861C9', '#009DB5'],
    light: ['#e8f6fa', '#bedfe6'],
    ink: '#7BB9FF',
    detail: '#FFE06D',
  },
  {
    id: 'galaxy',
    name: 'Midnight Galaxy',
    unlockAt: 365,
    dark: ['#3510A8', '#7625C7'],
    light: ['#f0eafe', '#d7d1f1'],
    ink: '#C18AFF',
    detail: '#5AD7FF',
  },
];
export const backgroundUnlocked = (index: number, completed: number) =>
  !!BACKGROUNDS[index] && completed >= BACKGROUNDS[index].unlockAt;
