export const Colors = {
  rose:      '#C85D7A',
  roseDark:  '#A84A64',
  pink:      '#F2A7BB',
  pinkLight: '#FDE8EF',
  cream:     '#FDF6F0',
  charcoal:  '#1C1C1E',
  mid:       '#5C5058',
  soft:      '#9B8990',
  white:     '#FFFFFF',
  gold:      '#C9A96E',
  error:     '#D32F2F',
  success:   '#1A9E4A',
  border:    'rgba(242,167,187,0.25)',
  shadow:    'rgba(28,28,30,0.10)',
};

// Semantic theme tokens for the owner app
export const LightTheme = {
  bgBase:      '#FDF6F0',
  bgCard:      '#FFFFFF',
  bgElevated:  '#F5ECE7',
  bgInput:     '#F5ECE7',
  textPrimary: '#1C1C1E',
  textSec:     '#5C5058',
  textMuted:   '#9B8990',
  border:      'rgba(200,93,122,0.18)',
  shadow:      'rgba(28,28,30,0.08)',
  rose:        '#C85D7A',
  gold:        '#C9A96E',
  success:     '#1A9E4A',
  error:       '#D32F2F',
  white:       '#FFFFFF',
  tabBg:       '#FFFFFF',
  tabActive:   '#C85D7A',
  tabInactive: '#9B8990',
  statusBar:   'dark-content' as const,
};

export const DarkTheme = {
  bgBase:      '#0F0A0D',
  bgCard:      '#1A1014',
  bgElevated:  '#251420',
  bgInput:     '#1A1014',
  textPrimary: '#F5EEF0',
  textSec:     '#9E8A90',
  textMuted:   '#5C4A52',
  border:      'rgba(200,93,122,0.18)',
  shadow:      'rgba(0,0,0,0.35)',
  rose:        '#C85D7A',
  gold:        '#C9A96E',
  success:     '#1A9E4A',
  error:       '#D32F2F',
  white:       '#FFFFFF',
  tabBg:       '#110A0E',
  tabActive:   '#C85D7A',
  tabInactive: '#5C4A52',
  statusBar:   'light-content' as const,
};

export type AppTheme = typeof LightTheme;

// Tab bar tokens
export const TabBar = {
  owner: {
    active:   Colors.rose,
    inactive: Colors.soft,
    bg:       Colors.white,
  },
  consumer: {
    active:   Colors.rose,
    inactive: Colors.soft,
    bg:       Colors.white,
  },
};

export default Colors;

