import { FONTS } from "../../../constants/fonts";

export const PROFILE_COLORS = {
  background: "#0E4527",
  ink: "#073C1D",
  heading: "#0B3D22",
  label: "#5B6B58",
  faded: "#7C8A78",
  gold: "#F2B233",
  goldLight: "#FFD66E",
  avatarBg: "#D8ECCE",
  pillBorder: "#2F7A41",
  pillText: "#1A4D2B",
  lockedBg: "#ECE2C8",
  lockedBorder: "#A89D7C",
  lockedText: "#7A6F55",
};

// Small caps label above a group of fields or rows ("ANIMALS BY GROUP").
export const sectionLabelStyle = {
  fontFamily: FONTS.bodyBlack,
  color: PROFILE_COLORS.label,
  fontSize: 11,
  letterSpacing: 1,
};
