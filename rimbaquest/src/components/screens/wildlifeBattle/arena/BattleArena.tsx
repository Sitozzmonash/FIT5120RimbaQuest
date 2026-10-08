import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageStyle,
  LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BATTLE_IMAGES, habitatBackground } from "../../../../constants/images";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WoodModal } from "../../../common/game/WoodModal";
import {
  WildlifeAction,
  WildlifeCombatant,
  WildlifeEvent,
  WildlifeSide,
} from "../../../../types/wildlifeMatch";
import { ErrorNote } from "../shared/ErrorNote";
import { BattleFXLayer, Point, useBattleFX } from "./fx";
import { HabitatSign } from "./HabitatSign";
import { BattleMove } from "./MoveCard";
import { MoveGrid } from "./MoveGrid";
import { StageCard } from "./StageCard";
import { StatusPanel } from "./StatusPanel";
import { useBattleReplay } from "./useBattleReplay";
import { VsBadge } from "./VsBadge";

export type { BattleMove } from "./MoveCard";

// The habitat art is 780x1686, drawn full width and nudged up like the design.
const HABITAT_ASPECT = 1686 / 780;
const HABITAT_TOP = -40;
const MY_TAG_COLOR = "#1F6B33";
const OPPONENT_TAG_COLOR = "#B8431F";

export function BattleArena({
  habitat,
  mySide,
  opponentTag,
  myCard,
  opponentCard,
  events,
  turnLabel,
  myTurn,
  moves,
  onMove,
  onLeave,
  leaveDisabled,
  energyRule,
  error,
  onRefresh,
  onReplayed,
}: {
  habitat: string;
  mySide: WildlifeSide;
  opponentTag: string;
  myCard: WildlifeCombatant;
  opponentCard: WildlifeCombatant;
  events: WildlifeEvent[];
  turnLabel: string;
  myTurn: boolean;
  moves: BattleMove[];
  onMove: (action: WildlifeAction) => void;
  onLeave: () => void;
  leaveDisabled: boolean;
  energyRule: string;
  error: string | null;
  onRefresh: () => void;
  onReplayed?: (eventId: number) => void;
}) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(window.width);
  const [stageHeight, setStageHeight] = useState(300);
  const [rulesVisible, setRulesVisible] = useState(true);
  const opponentSide: WildlifeSide =
    mySide === "player" ? "opponent" : "player";

  const fx = useBattleFX();
  const centres = useRef<Partial<Record<WildlifeSide, Point>>>({});
  const cards = useMemo(
    () =>
      ({ [mySide]: myCard, [opponentSide]: opponentCard }) as Record<
        WildlifeSide,
        WildlifeCombatant
      >,
    [mySide, opponentSide, myCard, opponentCard],
  );
  const { shown, animating } = useBattleReplay({
    events,
    cards,
    fx,
    centres,
    onReplayed,
  });

  const cardWidth = Math.min(170, Math.max(130, (width - 72) / 2));
  // The cards shrink their photo to whatever height the stage has left, so the arena never scrolls.
  const photoHeight = Math.max(56, Math.min(130, stageHeight - 160));
  // The bubble follows the turn, but waits for the last hit to finish.
  const turnSide = animating ? null : myTurn ? mySide : opponentSide;

  const measure = (side: WildlifeSide) => (event: LayoutChangeEvent) => {
    const { x, y, width: w, height: h } = event.nativeEvent.layout;
    centres.current[side] = { x: x + w / 2, y: y + h / 2 };
  };

  const stageCard = (side: WildlifeSide) => {
    const mine = side === mySide;
    return (
      <StageCard
        key={side}
        combatant={shown[side]}
        tag={mine ? "YOU" : opponentTag}
        tagColor={mine ? MY_TAG_COLOR : OPPONENT_TAG_COLOR}
        turnLabel={turnSide === side ? turnLabel : null}
        tilt={mine ? -4 : 4}
        width={cardWidth}
        photoHeight={photoHeight}
        motionStyle={fx.styleFor(side)}
        onLayout={measure(side)}
      />
    );
  };

  return (
    <View
      style={styles.root}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Image
        source={habitatBackground(habitat)}
        style={
          [
            styles.habitatImage,
            {
              top: HABITAT_TOP + insets.top,
              width,
              height: width * HABITAT_ASPECT,
            },
          ] as ImageStyle
        }
        resizeMode="cover"
      />
      <View style={[styles.statusBarFill, { height: insets.top }]} />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <HabitatSign habitat={habitat} />

        <View style={styles.statusRow}>
          <StatusPanel
            combatant={shown[mySide]}
            tag="YOU"
            tagColor={MY_TAG_COLOR}
            habitat={habitat}
          />
          <StatusPanel
            combatant={shown[opponentSide]}
            tag={opponentTag}
            tagColor={OPPONENT_TAG_COLOR}
            habitat={habitat}
          />
        </View>

        {/* Heavy hits (stomp, zap, charge…) shake the whole stage. */}
        <Animated.View
          style={[styles.stage, fx.screenStyle]}
          onLayout={(event) => setStageHeight(event.nativeEvent.layout.height)}
        >
          {stageCard(mySide)}
          <VsBadge />
          {stageCard(opponentSide)}
          <BattleFXLayer fx={fx} />
        </Animated.View>

        {error ? (
          <ErrorNote
            message={error}
            actionLabel="Retry"
            onAction={onRefresh}
            disabled={leaveDisabled}
          />
        ) : null}

        <MoveGrid
          moves={moves}
          locked={!myTurn || animating}
          onMove={onMove}
          onGiveUp={onLeave}
          giveUpDisabled={leaveDisabled}
        />
      </View>

      <WoodModal
        visible={rulesVisible}
        onRequestClose={() => setRulesVisible(false)}
        icon={BATTLE_IMAGES.energy}
        positive
        stars={false}
        title="One Move Per Turn"
        message={energyRule}
        actionLabel="I Understand"
        onAction={() => setRulesVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#BCA42D", overflow: "hidden" },
  habitatImage: { position: "absolute", left: 0 },
  statusBarFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: GAME_COLORS.headerGreen,
  },
  content: { flex: 1, paddingHorizontal: 12, gap: 10 },
  statusRow: { flexDirection: "row", gap: 10 },
  stage: {
    flex: 1,
    minHeight: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
});
