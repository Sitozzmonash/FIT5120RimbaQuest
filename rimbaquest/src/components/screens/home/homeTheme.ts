import { FONTS } from '../../../constants/fonts';

// Palette for the camp map home screen.
export const HOME_COLORS = {
  ink: '#073C1D',
  ground: '#D9C38F',
  paper: '#FDF2D9',
  wood: '#B86F32',
  woodLine: 'rgba(90, 45, 10, 0.2)',
  woodText: '#FFF6DC',
  woodTextShadow: '#3B1E06',
  heading: '#0B3D22',
  badgeGreen: '#1F6B33',
  gold: '#F2B233',
  goldLight: '#FFD66E',
};

// Lilita One with a dark outline-ish shadow, used on every wooden sign.
export const signTextStyle = {
  fontFamily: FONTS.display,
  color: HOME_COLORS.woodText,
  textShadowColor: HOME_COLORS.woodTextShadow,
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 1,
};
