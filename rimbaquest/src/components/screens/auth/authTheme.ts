import { TextStyle } from "react-native";
import { FONTS } from "../../../constants/fonts";

// Palette shared by the log in, sign up and password recovery screens.
export const AUTH_COLORS = {
  background: "#0E4527",
  ink: "#073C1D",
  paper: "#FDF2D9",
  card: "#F5F0E1",
  title: "#0E4527",
  body: "#2D5A3E",
  link: "#0A4D26",
  inputBorder: "#B8D9C0",
  icon: "#2D7A4E",
  placeholder: "#9AB5A4",
  error: "#D9383A",
  errorBg: "#FFF6F6",
};

export const authTitleStyle: TextStyle = {
  fontFamily: FONTS.display,
  color: AUTH_COLORS.title,
  fontSize: 26,
  textAlign: "center",
};

export const authBodyStyle: TextStyle = {
  fontFamily: FONTS.bodySemiBold,
  color: AUTH_COLORS.body,
  fontSize: 14,
  lineHeight: 21,
  textAlign: "center",
};
