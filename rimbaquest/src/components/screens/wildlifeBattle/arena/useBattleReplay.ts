import { MutableRefObject, useEffect, useRef, useState } from "react";
import {
  WildlifeCombatant,
  WildlifeEvent,
  WildlifeSide,
} from "../../../../types/wildlifeMatch";
import { Point, useBattleFX } from "./fx";
import { pickMoveEffect } from "./fx/moveEffects";

type Cards = Record<WildlifeSide, WildlifeCombatant>;
type FX = ReturnType<typeof useBattleFX>;

const PAUSE_MS = 350;

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

// Applies one move's events to the cards on screen, mirroring the server's maths.
function applyEvents(cards: Cards, events: WildlifeEvent[]): Cards {
  const next: Cards = {
    player: { ...cards.player },
    opponent: { ...cards.opponent },
  };
  for (const event of events) {
    const value = event.value ?? 0;
    if (event.type === "action" && event.side) {
      const actor = next[event.side];
      actor.energy = clamp(actor.energy - (event.cost ?? 0), actor.max_energy);
    } else if (event.type === "damage" && event.target) {
      const target = next[event.target];
      target.hp = clamp(target.hp - value, target.max_hp);
      target.shield = Math.max(
        0,
        (target.shield ?? 0) - (event.shield_absorbed ?? 0),
      );
    } else if (event.type === "heal" && event.target) {
      const target = next[event.target];
      target.hp = clamp(target.hp + value, target.max_hp);
    } else if (event.type === "shield" && event.target) {
      const target = next[event.target];
      target.shield = (target.shield ?? 0) + value;
    } else if (event.type === "recharge" && event.target) {
      const target = next[event.target];
      target.energy = clamp(target.energy + value, target.max_energy);
    }
  }
  return next;
}

// What a move said, minus the Energy recharge line.
function moveMessages(group: WildlifeEvent[]): string[] {
  return group
    .filter((event) => event.type !== "recharge" && event.message)
    .map((event) => event.message);
}

// The latest move in a match's history: its "action" event and what followed.
function lastMove(events: WildlifeEvent[]): WildlifeEvent[] {
  const sorted = [...events].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    if (sorted[index].type === "action") return sorted.slice(index);
  }
  return sorted.slice(-1);
}

/**
 * Animates new battle events one move at a time and holds the HP/Energy bars
 * until each hit lands. Events already in the match when the arena opens are
 * not replayed. Cards are keyed by server side ("player" / "opponent").
 */
export function useBattleReplay({
  events,
  cards,
  fx,
  centres,
  mySide,
  onReplayed,
}: {
  events: WildlifeEvent[];
  cards: Cards;
  fx: FX;
  centres: MutableRefObject<Partial<Record<WildlifeSide, Point>>>;
  mySide?: WildlifeSide;
  /** Called with the last event id once everything queued has played. */
  onReplayed?: (eventId: number) => void;
}) {
  const [shown, setShown] = useState<Cards>(cards);
  const [animating, setAnimating] = useState(false);
  // The last move in words, updated as each animation lands.
  const [log, setLog] = useState<string[]>(() =>
    moveMessages(lastMove(events)),
  );
  const lastSeen = useRef<number | null>(null);
  const queue = useRef<WildlifeEvent[]>([]);
  const running = useRef(false);
  const latest = useRef(cards);
  latest.current = cards;
  const latestFx = useRef(fx);
  latestFx.current = fx;
  const latestOnReplayed = useRef(onReplayed);
  latestOnReplayed.current = onReplayed;

  useEffect(() => {
    const ids = events.flatMap((event) =>
      typeof event.id === "number" ? [event.id] : [],
    );
    const newest = ids.length ? Math.max(...ids) : 0;
    if (lastSeen.current === null) {
      // First look at this match: everything so far already happened.
      lastSeen.current = newest;
      latestOnReplayed.current?.(newest);
      return;
    }
    const fresh = events
      .filter(
        (event) =>
          typeof event.id === "number" && event.id > (lastSeen.current ?? 0),
      )
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    if (!fresh.length) {
      if (!running.current) setShown(latest.current);
      return;
    }
    lastSeen.current = newest;
    queue.current.push(...fresh);
    void drain();
  }, [events, cards]);

  async function drain() {
    if (running.current) return;
    running.current = true;
    setAnimating(true);
    let shownNow = shown;
    while (queue.current.length) {
      // One move: an "action" event plus everything up to the next action.
      const group = [queue.current.shift()!];
      while (queue.current.length && queue.current[0].type !== "action")
        group.push(queue.current.shift()!);
      await playMove(group);
      shownNow = applyEvents(shownNow, group);
      setShown(shownNow);
      const messages = moveMessages(group);
      if (messages.length) setLog(messages);
    }
    running.current = false;
    setAnimating(false);
    setShown(latest.current);
    latestOnReplayed.current?.(lastSeen.current ?? 0);
  }

  async function playMove(group: WildlifeEvent[]) {
    const action = group.find((event) => event.type === "action");
    const attacker = action?.side;
    if (!action || !attacker) {
      // Timeouts and other turn notes: no animation, just a beat.
      await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
      return;
    }
    const defender: WildlifeSide =
      attacker === "player" ? "opponent" : "player";
    const from = centres.current[attacker];
    const to = centres.current[defender];
    if (!from || !to) {
      await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
      return;
    }
    const damage = group.find(
      (event) => event.type === "damage" && event.target === defender,
    );
    const heal = group.find(
      (event) => event.type === "heal" && event.target === attacker,
    );
    const shield = group.find(
      (event) => event.type === "shield" && event.target === attacker,
    );
    const gain = shield?.value
      ? { label: `+${shield.value} Shield`, color: "#6FC3E8" }
      : heal?.value
        ? { label: `+${heal.value} HP`, color: "#4CB35A" }
        : undefined;
    const damageTaken = damage
      ? (damage.value ?? 0) + (damage.shield_absorbed ?? 0)
      : 0;
    const effect = pickMoveEffect({
      action: action.action,
      attacker: latest.current[attacker],
      move: group,
    });
    await latestFx.current.play({
      ...effect,
      attacker,
      from,
      to,
      damage: damageTaken || undefined,
      hitsMe: defender === mySide,
      gain,
    });
    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS / 2));
  }

  return { shown, animating, log };
}
