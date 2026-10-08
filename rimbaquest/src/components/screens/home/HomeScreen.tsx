import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { avatarImageFor, HOME_MAP_IMAGES } from "../../../constants/images";
import { useDisplayProgress } from "../../../hooks/useDisplayProgress";
import { useUnlockedBattleSpecies } from "../../../hooks/useUnlockedBattleSpecies";
import { useBattleInviteStore } from "../../../store/useBattleInviteStore";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useUserStore } from "../../../store/useUserStore";
import { CampProfileButton } from "./components/CampProfileButton";
import { HomeHeader } from "./components/HomeHeader";
import { HomeMapCanvas } from "./components/HomeMapCanvas";
import { MapNodeButton } from "./components/MapNodeButton";
import { MapCritters } from "./components/MapCritters";
import { MapGroundLayer } from "./components/MapGroundLayer";
import { MapHintBubble } from "./components/MapHintBubble";
import { MapPathingDebug } from "./components/MapPathingDebug";
import { MapScenery } from "./components/MapScenery";
import { HomeMenu, MenuConfirmModal } from "./components/MenuConfirmModal";
import { NoticeModal } from "./components/NoticeModal";
import { ResumeList } from "./components/ResumeList";
import { RESUME_SHEET_PEEK, ResumeSheet } from "./components/ResumeSheet";
import { HOME_COLORS } from "./homeTheme";
import { SHOW_MAP_DEBUG } from "./mapPathing";
import {
  MAP_BATTLE_HINT_POSITION,
  MAP_CAMP_POSITION,
  MAP_NODE_POSITIONS,
} from "./homeMapLayout";

export function HomeScreen() {
  const currentUser = useUserStore((state) => state.currentUser);
  const progress = useDisplayProgress();
  const battleReady = useUnlockedBattleSpecies().length > 0;
  const inviteCount = useBattleInviteStore((state) => state.incomingCount);
  const open = useNavigationStore.getState().open;
  const insets = useSafeAreaInsets();
  const [bodyHeight, setBodyHeight] = useState(0);
  const [battleHintVisible, setBattleHintVisible] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingMenu, setPendingMenu] = useState<HomeMenu | null>(null);
  const avatar = avatarImageFor(currentUser.avatar);

  const enterMenu = () => {
    const menu = pendingMenu;
    setPendingMenu(null);
    if (menu === "discover") open("locations");
    else if (menu === "capture") useDiscoveryStore.getState().start();
    else if (menu === "collection") open("collection");
    else if (menu === "battle") open("battle_select");
    else if (menu === "camp") open("progress");
  };

  // Tapping the locked battle node shows why it's locked for a few seconds.
  const showBattleHint = () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setBattleHintVisible(true);
    hintTimer.current = setTimeout(() => setBattleHintVisible(false), 2000);
  };

  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  return (
    <View style={styles.root}>
      <HomeHeader />

      <View
        style={styles.body}
        onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}
      >
        <HomeMapCanvas>
          <MapScenery />
          <MapGroundLayer />
          <MapNodeButton
            {...MAP_NODE_POSITIONS.discover}
            label="Discover"
            accessibilityLabel="Discover places to see animals"
            icon={HOME_MAP_IMAGES.iconDiscover}
            iconSize={{ width: 54, height: 46.56 }}
            color="#D8ECCE"
            onPress={() => setPendingMenu("discover")}
          />
          <MapNodeButton
            {...MAP_NODE_POSITIONS.capture}
            featured
            label="Capture"
            accessibilityLabel="Capture an animal photo"
            icon={HOME_MAP_IMAGES.iconCapture}
            iconSize={{ width: 74, height: 57.03 }}
            color="#FFE7A8"
            onPress={() => setPendingMenu("capture")}
          />
          <MapNodeButton
            {...MAP_NODE_POSITIONS.collection}
            label="Collection"
            accessibilityLabel={`Collection, ${progress.found} of ${progress.total} discovered`}
            icon={HOME_MAP_IMAGES.iconCollection}
            iconSize={{ width: 50, height: 56.25 }}
            color={HOME_COLORS.paper}
            badge={`${progress.found}/${progress.total}`}
            onPress={() => setPendingMenu("collection")}
          />
          <MapNodeButton
            {...MAP_NODE_POSITIONS.battle}
            label="Battle"
            accessibilityLabel={
              battleReady
                ? inviteCount > 0
                  ? `Battle, ${inviteCount} ${inviteCount === 1 ? "invitation" : "invitations"} waiting`
                  : "Battle"
                : "Battle, locked. Capture an animal to unlock battles"
            }
            icon={HOME_MAP_IMAGES.iconBattle}
            iconSize={{ width: 50, height: 45.31 }}
            color="#FFD3BD"
            locked={!battleReady}
            badge={inviteCount > 0 ? String(inviteCount) : undefined}
            onPress={battleReady ? () => setPendingMenu("battle") : showBattleHint}
          />
          {!battleReady && battleHintVisible && (
            <MapHintBubble
              {...MAP_BATTLE_HINT_POSITION}
              text="Capture an animal to unlock battles!"
            />
          )}
          <CampProfileButton
            {...MAP_CAMP_POSITION}
            name={currentUser.display_name}
            level={progress.level || currentUser.level}
            avatar={avatar}
            onPress={() => setPendingMenu("camp")}
          />
          <MapCritters layer="air" />
          {SHOW_MAP_DEBUG && <MapPathingDebug />}
        </HomeMapCanvas>

        {/* Reserves the collapsed sheet's space so the map scales above it. */}
        <View style={{ height: RESUME_SHEET_PEEK + insets.bottom }} />

        {bodyHeight > 0 && (
          <ResumeSheet availableHeight={bodyHeight}>
            <ResumeList />
          </ResumeSheet>
        )}
      </View>

      <MenuConfirmModal
        menu={pendingMenu}
        campAvatar={avatar}
        onEnter={enterMenu}
        onCancel={() => setPendingMenu(null)}
      />
      <NoticeModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: HOME_COLORS.ground, overflow: "hidden" },
  body: { flex: 1 },
});
