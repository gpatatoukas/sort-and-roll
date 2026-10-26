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
    dark: ['#092c42', '#07534e'],
    light: ['#ffe39b', '#d8f8e9'],
    ink: '#16b89e',
    detail: '#ffb82e',
  },
  {
    id: 'lagoon',
    name: 'Jade Lagoon',
    unlockAt: 5,
    dark: ['#0c222b', '#154244'],
    light: ['#e6f7ef', '#bce8dd'],
    ink: '#4fc5b0',
    detail: '#b7f0cb',
  },
  {
    id: 'sunset',
    name: 'Peach Solstice',
    unlockAt: 10,
    season: 'Summer',
    dark: ['#261e3b', '#6b3e4e'],
    light: ['#fff3d7', '#f4c8bc'],
    ink: '#f7ae75',
    detail: '#e9bdca',
  },
  {
    id: 'garden',
    name: 'Cloud Garden',
    unlockAt: 15,
    dark: ['#19223b', '#33466b'],
    light: ['#edf5ff', '#dce7fa'],
    ink: '#c5d5ef',
    detail: '#f8eecc',
  },
  {
    id: 'blossom',
    name: 'Sakura Wish',
    unlockAt: 25,
    season: 'Spring',
    dark: ['#24182e', '#4e2e49'],
    light: ['#fff0f6', '#efd4e5'],
    ink: '#eca6c7',
    detail: '#e4c397',
  },
  {
    id: 'halloween',
    name: 'Haunted Hollow',
    unlockAt: 40,
    season: 'Halloween',
    dark: ['#1b142c', '#3c2544'],
    light: ['#f3e7f6', '#efceaf'],
    ink: '#ee9c4b',
    detail: '#bda1ed',
  },
  {
    id: 'forest',
    name: 'Firefly Grove',
    unlockAt: 60,
    dark: ['#101f26', '#183d34'],
    light: ['#e8f1db', '#c3dec7'],
    ink: '#72ad87',
    detail: '#f1df83',
  },
  {
    id: 'christmas',
    name: 'Christmas Glow',
    unlockAt: 80,
    season: 'Christmas',
    dark: ['#351727', '#5a2635'],
    light: ['#fff2df', '#efc9c7'],
    ink: '#67a88a',
    detail: '#e8bf70',
  },
  {
    id: 'reef',
    name: 'Coral Daydream',
    unlockAt: 100,
    dark: ['#0c213a', '#104b5c'],
    light: ['#dff8fb', '#badfe9'],
    ink: '#e99aab',
    detail: '#77d4cc',
  },
  {
    id: 'autumn',
    name: 'Amber Orchard',
    unlockAt: 125,
    season: 'Autumn',
    dark: ['#2c222c', '#593b37'],
    light: ['#fff3de', '#ead6b6'],
    ink: '#d79b57',
    detail: '#b76f54',
  },
  {
    id: 'aurora',
    name: 'Winter Aurora',
    unlockAt: 150,
    season: 'Winter',
    dark: ['#0c1933', '#16383f'],
    light: ['#eaf6fa', '#cddfe9'],
    ink: '#6ce0c0',
    detail: '#ab9bf4',
  },
  {
    id: 'lantern',
    name: 'Lantern Wishes',
    unlockAt: 175,
    season: 'Lunar New Year',
    dark: ['#22172c', '#51283b'],
    light: ['#fff0e2', '#f0d4c4'],
    ink: '#dc7a6a',
    detail: '#eac07c',
  },
  {
    id: 'lavender',
    name: 'Lavender Haze',
    unlockAt: 200,
    dark: ['#201c3e', '#49365c'],
    light: ['#f5efff', '#dfd4ed'],
    ink: '#b4a0e1',
    detail: '#8bb9a0',
  },
  {
    id: 'carnival',
    name: 'Summer Carnival',
    unlockAt: 250,
    season: 'Summer',
    dark: ['#202a41', '#4a3e60'],
    light: ['#fff3e2', '#e5dff7'],
    ink: '#edb67e',
    detail: '#c5a0ec',
  },
  {
    id: 'starfall',
    name: 'Meteor Shower',
    unlockAt: 300,
    dark: ['#102e42', '#245568'],
    light: ['#e8f6fa', '#bedfe6'],
    ink: '#9baeea',
    detail: '#f3d8a1',
  },
  {
    id: 'galaxy',
    name: 'Midnight Galaxy',
    unlockAt: 365,
    dark: ['#100e29', '#39245b'],
    light: ['#f0eafe', '#d7d1f1'],
    ink: '#b08ce3',
    detail: '#85c7e6',
  },
];
export const backgroundUnlocked = (index: number, completed: number) =>
  !!BACKGROUNDS[index] && completed >= BACKGROUNDS[index].unlockAt;
