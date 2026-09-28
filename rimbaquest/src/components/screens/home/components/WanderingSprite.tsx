import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageSourcePropType,
  View,
} from "react-native";
import { DECOR_DEPTH_LINES, MAP_HEIGHT, MAP_OBSTACLES, walkerDepth } from "../homeMapLayout";
import { pickTarget, SHOW_MAP_DEBUG } from "../mapPathing";
import { useMapRoamRange } from "./HomeMapCanvas";

type Props = {
  source: ImageSourcePropType;
  frameWidth: number; // one frame's width in the strip PNG
  frameHeight: number; // one frame's height in the strip PNG
  height: number; // on-map height (map units)
  // Flyers roam the whole map above the menus; walkers treat the menus as
  // walls and only take straight walks that stay clear of them.
  flying?: boolean;
  speed?: number; // map units per second
  // Distance covered by one full walk cycle (all frames). The legs are driven
  // by distance walked, so they always keep pace with the movement.
  stride?: number;
  frames?: number;
};

// Trips shorter than this look like shuffling on the spot, so skip them.
const MIN_TRIP = 40;
// If no good spot turns up, look again this soon.
const RETRY_MS = 60;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// An animated animal (horizontal sprite strip) that wanders the home map.
// It ignores touches, so the menus underneath always stay tappable.
export function WanderingSprite({
  source,
  frameWidth,
  frameHeight,
  height,
  flying = false,
  speed = 28,
  stride = 22,
  frames = 8,
}: Props) {
  const width = Math.round((frameWidth * height) / frameHeight);
  const size = useMemo(() => ({ w: width, h: height }), [width, height]);
  // Where this animal may roam; wider than the drawn map on wide screens.
  // Kept in a ref so trips always use the latest size of the map.
  const { minX, maxX } = useMapRoamRange();
  const boundsRef = useRef({ x: minX, w: maxX - minX, h: MAP_HEIGHT });
  boundsRef.current = { x: minX, w: maxX - minX, h: MAP_HEIGHT };
  const bounds = boundsRef.current;
  const obstacles = flying ? [] : MAP_OBSTACLES;

  // Start somewhere the animal is allowed to stand.
  const start = useRef(pickTarget(null, size, bounds, obstacles, 200) ?? { x: 0, y: 0 }).current;
  const pos = useRef(new Animated.ValueXY(start)).current;
  // Total distance walked so far; the current frame is derived from it.
  const walked = useRef(new Animated.Value(0)).current;
  const facing = useRef(new Animated.Value(1)).current; // 1 = right, -1 = left
  const [reduceMotion, setReduceMotion] = useState(false);
  // Walkers are depth-sorted against the decor by where their feet are.
  const [depth, setDepth] = useState(() => walkerDepth(start.y + height));

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Keeps moving from one spot to the next without stopping. Each trip moves
  // the position and the "distance walked" counter together in one animation,
  // so there is no separate looping leg animation that could stall (which
  // happened on web, and on native after backgrounding).
  useEffect(() => {
    if (reduceMotion) return;
    let alive = true;
    let current = start;
    let walkedSoFar = 0;
    let timer: ReturnType<typeof setTimeout>;
    let trip: Animated.CompositeAnimation | null = null;
    let depthTimers: ReturnType<typeof setTimeout>[] = [];

    const clearDepthTimers = () => {
      depthTimers.forEach(clearTimeout);
      depthTimers = [];
    };

    // The position animates natively, so JS never sees it frame by frame. A
    // trip is a straight line at constant speed, though, so we know exactly
    // when the feet cross each decor's base and switch layer at those moments.
    const scheduleDepth = (fromY: number, toY: number, duration: number) => {
      clearDepthTimers();
      if (flying) return;
      const fromFeet = fromY + height;
      const toFeet = toY + height;
      setDepth(walkerDepth(fromFeet));
      if (fromFeet === toFeet) return;
      const low = Math.min(fromFeet, toFeet);
      const high = Math.max(fromFeet, toFeet);
      DECOR_DEPTH_LINES.filter((line) => line > low && line <= high).forEach((line) => {
        const at = ((line - fromFeet) / (toFeet - fromFeet)) * duration;
        // Just past the line when walking down, just before it when walking up.
        const feet = toFeet > fromFeet ? line : line - 0.01;
        depthTimers.push(setTimeout(() => alive && setDepth(walkerDepth(feet)), at));
      });
    };

    const tripTo = () => {
      if (!alive) return;
      const target = pickTarget(current, size, boundsRef.current, obstacles);
      const dist = target ? Math.hypot(target.x - current.x, target.y - current.y) : 0;
      if (!target || dist < MIN_TRIP) {
        timer = setTimeout(tripTo, RETRY_MS);
        return;
      }

      facing.setValue(target.x >= current.x ? 1 : -1);
      const duration = (dist / speed) * 1000;
      scheduleDepth(current.y, target.y, duration);
      trip = Animated.parallel([
        Animated.timing(pos, {
          toValue: target,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(walked, {
          toValue: walkedSoFar + dist,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
      trip.start(({ finished }) => {
        if (!alive) return;
        if (finished) {
          current = target;
          walkedSoFar += dist;
          tripTo();
          return;
        }
        // The walk was interrupted part-way: carry on from where it stopped.
        walked.stopAnimation((value) => {
          walkedSoFar = value;
        });
        pos.stopAnimation((value) => {
          current = value;
          clearDepthTimers();
          if (!flying) setDepth(walkerDepth(value.y + height));
          timer = setTimeout(tripTo, RETRY_MS);
        });
      });
    };

    // Stagger start times so the animals don't move in step.
    timer = setTimeout(tripTo, rand(0, 1500));

    return () => {
      alive = false;
      clearTimeout(timer);
      clearDepthTimers();
      trip?.stop();
    };
    // `obstacles` is constant for a given sprite; bounds are read from a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, size, speed, pos, walked, facing, start, flying, height]);

  // Steps through the strip one whole frame at a time.
  // Frame number = distance walked in frames, wrapped round the strip.
  const stripX = useMemo(() => {
    const frame = Animated.modulo(Animated.multiply(walked, frames / stride), frames);
    const input: number[] = [];
    const output: number[] = [];
    for (let i = 0; i < frames; i++) {
      input.push(i, i + 0.999);
      output.push(-i * width, -i * width);
    }
    return frame.interpolate({ inputRange: input, outputRange: output });
  }, [walked, frames, stride, width]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: flying ? undefined : depth,
        pointerEvents: "none",
        transform: [{ translateX: pos.x }, { translateY: pos.y }, { scaleX: facing }],
      }}
    >
      <View
        style={[
          { width, height, overflow: "hidden" },
          // Debug: the collision box used for pathing (cyan for walkers,
          // yellow for flyers, which ignore obstacles).
          SHOW_MAP_DEBUG && {
            borderWidth: 1,
            borderColor: flying ? "#FFD600" : "#00E5FF",
          },
        ]}
      >
        <Animated.Image
          source={source}
          style={{ width: width * frames, height, transform: [{ translateX: stripX }] }}
        />
      </View>
    </Animated.View>
  );
}
