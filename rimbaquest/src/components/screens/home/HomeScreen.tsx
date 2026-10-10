import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { avatarImageFor, HOME_MAP_IMAGES } from "../../../constants/images";
import { useDisplayProgress } from "../../../hooks/useDisplayProgress";
import { useUnlockedBattleSpecies } from "../../../hooks/useUnlockedBattleSpecies";
import { useBattleInviteStore } from "../../../store/useBattleInviteStore";
import { useDiscoveryStore } from "../../../store/useDiscoveryStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useSpeciesCatalogStore } from "../../../store/useSpeciesCatalogStore";
import { useUserStore } from "../../../store/useUserStore";
import { CampProfileButton } from "./components/CampProfileButton";
import { HomeHeader } from "./components/HomeHeader";
import { HomeMapCanvas } from "./components/HomeMapCanvas";
import { HomeTutorial, ResumeSheetHighlight, TUTORIAL_STEP_COUNT, TutorialDim, tutorialHighlightsResumeSheet, TutorialSignSpotlight } from "./components/HomeTutorial";
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
import { TutorialSign } from "./components/TutorialSign";
import { HOME_COLORS } from "./homeTheme";
import { SHOW_MAP_DEBUG } from "./mapPathing";
import {
  MAP_BATTLE_HINT_POSITION,
  MAP_CAMP_POSITION,
  MAP_NODE_POSITIONS,
} from "./homeMapLayout";
import { hasSeenTutorialSign, markTutorialSignSeen } from "./tutorialStorage";

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
  const [showTutorialHint, setShowTutorialHint] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const avatar = avatarImageFor(currentUser.avatar);
  const signSpotlight = showTutorialHint && tutorialStep === null;
  const homeDimmed = tutorialStep !== null || signSpotlight;

  useEffect(() => {
    let active = true;
    if (currentUser.id > 0) {
      void hasSeenTutorialSign(currentUser.id).then((seen) => {
        if (active && !seen) setShowTutorialHint(true);
      });
    }
    return () => { active = false; };
  }, [currentUser.id]);

  const startTutorial = () => {
    setPendingMenu(null);
    setShowTutorialHint(false);
    if (currentUser.id > 0) void markTutorialSignSeen(currentUser.id);
    setTutorialStep(0);
  };

  const advanceTutorial = () => {
    setTutorialStep((step) => step === null || step >= TUTORIAL_STEP_COUNT - 1 ? null : step + 1);
  };

  const selectMenu = (menu: HomeMenu) => {
    if (tutorialStep !== null) return;
    setPendingMenu(menu);
  };

  const refreshHome = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        useUserStore.getState().refreshProfile(),
        useSpeciesCatalogStore.getState().loadSpecies(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

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

  const onBattlePress = () => {
    if (tutorialStep !== null) return;
    if (battleReady) selectMenu("battle");
    else showBattleHint();
  };

  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  return (
    <View style={styles.root}>
      <View>
        <HomeHeader onRefresh={() => void refreshHome()} refreshing={refreshing} />
        {homeDimmed && <TutorialDim style={StyleSheet.absoluteFill} />}
      </View>

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
            onPress={() => selectMenu("discover")}
          />
          <MapNodeButton
            {...MAP_NODE_POSITIONS.capture}
            featured
            label="Capture"
            accessibilityLabel="Capture an animal photo"
            icon={HOME_MAP_IMAGES.iconCapture}
            iconSize={{ width: 74, height: 57.03 }}
            color="#FFE7A8"
            onPress={() => selectMenu("capture")}
          />
          <MapNodeButton
            {...MAP_NODE_POSITIONS.collection}
            label="Collection"
            accessibilityLabel={`Collection, ${progress.found} of ${progress.total} discovered`}
            icon={HOME_MAP_IMAGES.iconCollection}
            iconSize={{ width: 50, height: 56.25 }}
            color={HOME_COLORS.paper}
            badge={`${progress.found}/${progress.total}`}
            onPress={() => selectMenu("collection")}
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
            onPress={onBattlePress}
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
            onPress={() => selectMenu("camp")}
          />
          <TutorialSign onPress={startTutorial} />
          <MapCritters layer="air" />
          {signSpotlight && (
            <TutorialSignSpotlight>
              <MapHintBubble left={36} top={111} width={202} text="New explorer? Tap the Tutorial sign for a map tour!" />
            </TutorialSignSpotlight>
          )}
          {tutorialStep !== null && (
            <HomeTutorial
              step={tutorialStep}
              avatar={avatar}
              battleReady={battleReady}
              onBack={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
              onNext={advanceTutorial}
              onClose={() => setTutorialStep(null)}
            />
          )}
          {SHOW_MAP_DEBUG && <MapPathingDebug />}
        </HomeMapCanvas>

        {/* Reserves the collapsed sheet's space so the map scales above it. */}
        <View style={{ height: RESUME_SHEET_PEEK + insets.bottom }} />

        {bodyHeight > 0 && (
          <ResumeSheet availableHeight={bodyHeight}>
            <ResumeList />
          </ResumeSheet>
        )}
        {homeDimmed &&
          (tutorialHighlightsResumeSheet(tutorialStep) ? (
            <ResumeSheetHighlight height={RESUME_SHEET_PEEK + insets.bottom} />
          ) : (
            <TutorialDim style={[styles.sheetDim, { height: RESUME_SHEET_PEEK + insets.bottom }]} />
          ))}
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
  sheetDim: { left: 0, right: 0, bottom: 0 },
});
