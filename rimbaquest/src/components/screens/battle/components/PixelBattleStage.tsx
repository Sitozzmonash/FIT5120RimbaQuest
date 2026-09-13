import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { BattleCombatant, BattleEvent } from '../../../../types/battle';
import { PixelSprite, SpritePose } from './PixelSprite';
import { BattleCombatantHud } from './BattleCombatantHud';
import { BattleEffectLayer } from './BattleEffectLayer';

export interface PixelBattleStageProps {
  player: BattleCombatant;
  opponent: BattleCombatant;
  activeSide?: string;
  lastEvent?: BattleEvent | null;
  reducedMotion?: boolean;
}

export function PixelBattleStage({
  player,
  opponent,
  activeSide = 'player',
  lastEvent = null,
  reducedMotion = false,
}: PixelBattleStageProps) {
  const { width: screenWidth } = useWindowDimensions();
  // Safe bounds calculation for 320px and 390px widths
  // If container width is narrower than 350px, scale sprites down slightly to strictly prevent HUD overlap
  const isCompact = screenWidth < 360;
  const playerSpriteSize = isCompact ? 96 : 116;
  const opponentSpriteSize = isCompact ? 88 : 104;

  const playerBob = useRef(new Animated.Value(0)).current;
  const opponentBob = useRef(new Animated.Value(0)).current;
  const playerMove = useRef(new Animated.Value(0)).current;
  const opponentMove = useRef(new Animated.Value(0)).current;

  // Track pose states
  const [playerPose, setPlayerPose] = React.useState<SpritePose>('idle');
  const [opponentPose, setOpponentPose] = React.useState<SpritePose>('idle');

  // Idle floating loop with gentle offset
  useEffect(() => {
    if (reducedMotion) {
      playerBob.stopAnimation();
      opponentBob.stopAnimation();
      playerBob.setValue(0);
      opponentBob.setValue(0);
      return;
    }

    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(playerBob, {
            toValue: -4,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(playerBob, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(opponentBob, {
            toValue: -4,
            duration: 1060,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opponentBob, {
            toValue: 0,
            duration: 1060,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ),
    ];

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [opponentBob, playerBob, reducedMotion]);

  // Update poses and translations on battle events
  useEffect(() => {
    playerMove.stopAnimation();
    opponentMove.stopAnimation();
    playerMove.setValue(0);
    opponentMove.setValue(0);

    // Energy state checks for 'tired' pose
    const playerTired = player.energy <= player.max_energy * 0.25;
    const opponentTired = opponent.energy <= opponent.max_energy * 0.25;

    let nextPlayerPose: SpritePose = playerTired ? 'tired' : 'idle';
    let nextOpponentPose: SpritePose = opponentTired ? 'tired' : 'idle';

    if (reducedMotion || !lastEvent) {
      setPlayerPose(nextPlayerPose);
      setOpponentPose(nextOpponentPose);
      return;
    }

    const actor =
      lastEvent.side === 'player' ? playerMove : lastEvent.side === 'opponent' ? opponentMove : null;

    const targetSide =
      lastEvent.target ??
      (lastEvent.type === 'damage' ? (lastEvent.side === 'player' ? 'opponent' : 'player') : null);

    const target =
      targetSide === 'player' ? playerMove : targetSide === 'opponent' ? opponentMove : null;

    if (lastEvent.type === 'action') {
      if (lastEvent.side === 'player') nextPlayerPose = 'attack';
      if (lastEvent.side === 'opponent') nextOpponentPose = 'attack';

      if (actor) {
        Animated.sequence([
          Animated.timing(actor, {
            toValue: lastEvent.side === 'player' ? 14 : -14,
            duration: 140,
            useNativeDriver: true,
          }),
          Animated.timing(actor, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setPlayerPose(playerTired ? 'tired' : 'idle');
          setOpponentPose(opponentTired ? 'tired' : 'idle');
        });
      }
    } else if (lastEvent.type === 'damage') {
      if (targetSide === 'player') nextPlayerPose = 'hit';
      if (targetSide === 'opponent') nextOpponentPose = 'hit';

      if (target) {
        Animated.sequence([
          Animated.timing(target, {
            toValue: targetSide === 'player' ? -8 : 8,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(target, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setPlayerPose(playerTired ? 'tired' : 'idle');
          setOpponentPose(opponentTired ? 'tired' : 'idle');
        });
      }
    } else if (lastEvent.type === 'heal' || lastEvent.type === 'shield' || lastEvent.type === 'boost') {
      if (lastEvent.side === 'player') nextPlayerPose = 'celebrate';
      if (lastEvent.side === 'opponent') nextOpponentPose = 'celebrate';
      const timer = setTimeout(() => {
        setPlayerPose(playerTired ? 'tired' : 'idle');
        setOpponentPose(opponentTired ? 'tired' : 'idle');
      }, 350);
      return () => clearTimeout(timer);
    }

    setPlayerPose(nextPlayerPose);
    setOpponentPose(nextOpponentPose);
  }, [lastEvent, opponent.energy, opponent.max_energy, opponentMove, player.energy, player.max_energy, playerMove, reducedMotion]);

  const targetSide =
    lastEvent?.target ??
    (lastEvent?.type === 'damage' ? (lastEvent.side === 'player' ? 'opponent' : 'player') : 'opponent');

  return (
    <View style={styles.stage}>
      {/* Pristine Rainforest Arena Pixel Backdrop */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 320 220" preserveAspectRatio="none">
        <Rect width="320" height="220" fill="#A8D5B5" />
        {/* Distant canopy */}
        <Path
          d="M0 86h24V64h18V44h22v20h20V32h24v30h20V48h18v22h24V38h22v24h20V48h22v20h24v24h22v14H0z"
          fill="#4D856E"
        />
        {/* Midground jungle foliage */}
        <Path
          d="M0 120h30v-22h16v15h20V82h22v28h18V88h26v22h22V78h18v32h20V90h24v27h24v23h40v90H0z"
          fill="#316353"
        />
        {/* Forest floor arena terrain */}
        <Rect y="152" width="320" height="68" fill="#204238" />
        {/* Arena podium highlights */}
        <Path d="M0 156h68l-10 16H8zM245 132h75l-10 16h-65z" fill="#C9A65D" />
        <Path d="M0 172h150l-14 20H10zM175 118h145l-12 18H165z" fill="#8F6B38" />
        {/* Fireflies / ambient spores */}
        <Circle cx="30" cy="38" r="3.5" fill="#F6D576" opacity="0.8" />
        <Circle cx="290" cy="65" r="3" fill="#F6D576" opacity="0.8" />
        <Circle cx="160" cy="72" r="2.5" fill="#F6D576" opacity="0.6" />
      </Svg>

      <BattleEffectLayer activeEvent={lastEvent} targetSide={targetSide} reducedMotion={reducedMotion} />

      {/* Opponent Area (Top right sprite, top left HUD) */}
      <View style={styles.enemyRow}>
        <View style={styles.hudContainer}>
          <BattleCombatantHud combatant={opponent} isPlayer={false} />
        </View>
        <Animated.View
          style={[
            styles.spriteWrapper,
            {
              transform: [{ translateX: opponentMove }, { translateY: opponentBob }],
            },
          ]}
        >
          <PixelSprite
            speciesId={opponent.species_id}
            category={opponent.category}
            role={opponent.role}
            size={opponentSpriteSize}
            facing="left"
            pose={opponentPose}
            showRoleCue
          />
        </Animated.View>
      </View>

      {/* Player Area (Bottom left sprite, bottom right HUD) */}
      <View style={styles.playerRow}>
        <Animated.View
          style={[
            styles.spriteWrapper,
            {
              transform: [{ translateX: playerMove }, { translateY: playerBob }],
            },
          ]}
        >
          <PixelSprite
            speciesId={player.species_id}
            category={player.category}
            role={player.role}
            size={playerSpriteSize}
            facing="right"
            pose={playerPose}
            showRoleCue
          />
        </Animated.View>
        <View style={styles.hudContainer}>
          <BattleCombatantHud combatant={player} isPlayer />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 310,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#26423A',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#204238',
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  enemyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
    gap: 6,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
    gap: 6,
  },
  hudContainer: {
    flex: 1,
    maxWidth: 190,
    zIndex: 3,
  },
  spriteWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
