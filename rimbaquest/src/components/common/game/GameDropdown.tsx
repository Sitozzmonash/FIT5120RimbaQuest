import React, { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FONTS } from "../../../constants/fonts";
import { ScaleTap } from "../ScaleTap";
import { Tap } from "../Tap";
import { GAME_COLORS } from "./gameTheme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

export type DropdownOption<T extends string> = {
  id: T;
  label: string;
  icon?: IconName;
};

const MENU_WIDTH = 200;
const EDGE = 8;

// Chunky pill that opens its options in a small menu anchored below it. The
// menu renders in a Modal so it is never clipped by scroll views or covered
// by maps.
export function GameDropdown<T extends string>({
  label,
  options,
  value,
  onSelect,
  icon,
  iconOnly = false,
}: {
  label: string;
  options: DropdownOption<T>[];
  value: T;
  onSelect: (id: T) => void;
  icon?: IconName;
  iconOnly?: boolean;
}) {
  const anchorRef = useRef<View>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const current = options.find((option) => option.id === value) ?? options[0];
  const pillIcon = icon ?? current?.icon;

  const open = () => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      const left = Math.min(Math.max(x, EDGE), screenWidth - MENU_WIDTH - EDGE);
      setMenuPos({ top: y + height + 6, left });
    });
  };
  const close = () => setMenuPos(null);

  return (
    <View ref={anchorRef} collapsable={false}>
      <ScaleTap
        label={`${label}: ${current?.label}. Change`}
        style={styles.pill}
        onPress={open}
      >
        {pillIcon ? (
          <MaterialIcons
            name={pillIcon}
            size={18}
            color={GAME_COLORS.heading}
          />
        ) : null}
        {iconOnly ? null : (
          <Text style={styles.pillText}>{current?.label}</Text>
        )}
        <MaterialIcons
          name={menuPos ? "expand-less" : "expand-more"}
          size={18}
          color={GAME_COLORS.heading}
        />
      </ScaleTap>

      <Modal
        visible={menuPos !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable
          accessibilityLabel={`Close ${label} menu`}
          style={styles.backdrop}
          onPress={close}
        />
        {menuPos ? (
          <View style={[styles.menu, menuPos]}>
            <Text style={styles.menuTitle}>{label}</Text>
            <ScrollView style={styles.menuScroll} bounces={false}>
              {options.map((option) => {
                const active = option.id === value;
                return (
                  <Tap
                    key={option.id}
                    label={option.label}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      close();
                      if (!active) onSelect(option.id);
                    }}
                  >
                    {option.icon ? (
                      <MaterialIcons
                        name={option.icon}
                        size={18}
                        color={
                          active ? GAME_COLORS.goldText : GAME_COLORS.heading
                        }
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Tap>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 40,
    paddingLeft: 10,
    paddingRight: 6,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: GAME_COLORS.ink,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: FONTS.display,
    fontSize: 14,
    color: GAME_COLORS.heading,
  },
  backdrop: { ...StyleSheet.absoluteFill },
  menu: {
    position: "absolute",
    width: MENU_WIDTH,
    padding: 4,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: GAME_COLORS.ink,
    borderRadius: 14,
  },
  menuTitle: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
    fontFamily: FONTS.bodyBlack,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: GAME_COLORS.label,
  },
  menuScroll: { maxHeight: 320 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
  },
  optionActive: { backgroundColor: GAME_COLORS.goldLight },
  optionText: {
    fontFamily: FONTS.display,
    fontSize: 14,
    color: GAME_COLORS.heading,
  },
  optionTextActive: { color: GAME_COLORS.goldText },
});
