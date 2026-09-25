import { StyleSheet } from "react-native";

export const fieldStyles = StyleSheet.create({
  createField: { gap: 4 },
  createFieldLabel: { color: "#0A4D26", fontSize: 15, fontWeight: "700" },
  createInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D1E8D5",
    backgroundColor: "#F4FCF6",
    paddingHorizontal: 16,
  },
  createInputBoxError: { borderColor: "#D9383A", backgroundColor: "#FFF6F6" },
  createInput: {
    flex: 1,
    color: "#0A4D26",
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  createEyeToggle: { padding: 2 },
  createFieldError: { color: "#D9383A", fontSize: 11, fontWeight: "700" },
});
