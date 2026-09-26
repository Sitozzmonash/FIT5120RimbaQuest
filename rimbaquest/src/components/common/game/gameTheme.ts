import { FONTS } from "../../../constants/fonts";

// Shared palette for the chunky "game" UI (headers, wood planks, 3D buttons).
export const GAME_COLORS = {
  ink: "#073C1D",
  headerGreen: "#0E4527",
  paper: "#FDF2D9",
  wood: "#B86F32",
  woodLine: "rgba(90, 45, 10, 0.2)",
  woodText: "#FFF6DC",
  woodTextShadow: "#3B1E06",
  rivet: "#5A2D0A",
  go: "#3F9A4E",
  track: "#E4D6B4",
  divider: "#D9C79B",
};

// Lilita One with a dark outline-ish shadow, used on headers and plank signs.
export const outlinedTitleStyle = {
  fontFamily: FONTS.display,
  color: GAME_COLORS.woodText,
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 1,
};
