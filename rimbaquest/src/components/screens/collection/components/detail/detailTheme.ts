import { FONTS } from "../../../../../constants/fonts";

export const DETAIL_IMAGES = {
  chatBubble: require("../../../../../../assets/collection/detail-chat-bubble.png"),
  rocks: require("../../../../../../assets/collection/detail-rocks.png"),
  heart: require("../../../../../../assets/collection/detail-heart.png"),
  swords: require("../../../../../../assets/collection/detail-swords.png"),
  lock: require("../../../../../../assets/collection/locked-lock.png"),
  modalBush: require("../../../../../../assets/collection/modal-bush.png"),
  modalLeaf: require("../../../../../../assets/collection/modal-leaf.png"),
  perkRays: require("../../../../../../assets/collection/perk-rays.png"),
  locationPin: require("../../../../../../assets/locations/location-pin.png"),
};

// Soft gold glow behind the unlock-ability card.
export const MODAL_GLOW_SVG = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="390" height="360" viewBox="0 0 390 360" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse id="modal-glow" cx="195" cy="180" rx="195" ry="180" fill="url(#paint0_radial_0_42)"/>
<defs>
<radialGradient id="paint0_radial_0_42" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(195 180) scale(195 180)">
<stop stop-color="#FFD66E" stop-opacity="0.25"/>
<stop offset="0.65" stop-color="#FFD66E" stop-opacity="0"/>
<stop offset="1" stop-color="#FFD66E" stop-opacity="0"/>
</radialGradient>
</defs>
</svg>`;

export const DETAIL_COLORS = {
  background: "#0E4527",
  ink: "#073C1D",
  paper: "#FDF2D9",
  heading: "#0B3D22",
  body: "#3D5443",
  label: "#5B6B58",
  gold: "#FFD66E",
  goldText: "#4A2A05",
  green: "#3F9A4E",
  badgeGreen: "#1F6B33",
  mint: "#D8ECCE",
  mintBorder: "#2F7A41",
  mintText: "#1A4D2B",
};

// Small caps field label ("SCIENTIFIC NAME", "HP").
export const fieldLabelStyle = {
  fontFamily: FONTS.bodyBlack,
  color: DETAIL_COLORS.label,
  fontSize: 11,
  letterSpacing: 1,
};
