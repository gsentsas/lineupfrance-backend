import { DefaultTheme, Theme } from '@react-navigation/native';
import tokens from '../../shared-design/tokens';

export const palette = {
  background: '#05060d',
  card: 'rgba(255,255,255,0.04)',
  text: '#f5f7fb',
  muted: 'rgba(245,247,251,0.65)',
  border: 'rgba(255,255,255,0.12)',
  ...tokens.colors,
};

export const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: tokens.colors.primary,
    background: palette.background,
    card: palette.card,
    text: palette.text,
    border: palette.border,
    notification: tokens.colors.secondary,
  },
};

export const gradient = [tokens.colors.primary, tokens.colors.tertiary, tokens.colors.secondary];
