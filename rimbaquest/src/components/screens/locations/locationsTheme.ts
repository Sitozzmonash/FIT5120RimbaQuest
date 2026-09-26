import { FONTS } from "../../../constants/fonts";

export const LOCATION_COLORS = {
  ink: "#073C1D",
  forest: "#1A3C28",
  headerGreen: "#0E4527",
  paper: "#FDF2D9",
  panel: "#F5EDD6",
  wood: "#B86F32",
  woodLine: "rgba(90, 45, 10, 0.2)",
  woodText: "#FFF6DC",
  rivet: "#5A2D0A",
  heading: "#0B3D22",
  muted: "#3D5443",
  pillBg: "#D8ECCE",
  pillBorder: "#2F7A41",
  pillText: "#1A4D2B",
  go: "#3F9A4E",
};

// Lilita One with a dark outline-ish shadow, used on headers and plank signs.
export const outlinedTitleStyle = {
  fontFamily: FONTS.display,
  color: LOCATION_COLORS.woodText,
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 1,
};
