import { TextStyle } from 'react-native';
import { colors } from './colors';

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  full: 9999,
};

export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  titleBold: 'Quicksand_700Bold',
  titleSemiBold: 'Quicksand_600SemiBold',
};

export const type: Record<string, TextStyle> = {
  hero: {
    fontFamily: fonts.titleBold,
    fontSize: 32,
    lineHeight: 38,
    color: colors.ink,
  },
  titleLarge: {
    fontFamily: fonts.titleBold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.titleBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.titleSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.inkSecondary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  bodyMedium: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  bodyBold: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  captionBold: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSecondary,
  },
  micro: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.inkMuted,
  },
  moneyLarge: {
    fontFamily: fonts.titleBold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  },
  money: {
    fontFamily: fonts.titleBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
  },
  moneySmall: {
    fontFamily: fonts.titleBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
};
