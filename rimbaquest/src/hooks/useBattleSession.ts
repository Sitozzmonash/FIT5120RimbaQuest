import { useState, useRef, useCallback, useEffect } from "react";
import { AccessibilityInfo } from "react-native";
import {
  BattleState,
  BattleActionType,
  BattleEvent,
  BattleCombatant,
  BattlePhase,
  BattleOutcomeType,
  BattleDifficulty,
  ActionPreview,
  BattleSessionResponse,
  BattleRollResponse,
  BattleActionResponse,
  BattleSurrenderResponse,
} from "../types/battle";
import { Species } from "../types";

export interface UseBattleSessionOptions {
  apiBase: string;
  childId: number;
  token?: string;
  selectedSpecies: Species | null;
  difficulty?: BattleDifficulty;
  active?: boolean;
  onSessionExpired?: () => Promise<void> | void;
  onXpAwarded?: (totalXp: number) => void;
}

type StoredCommand =
  | {
      type: "start";
      url: string;
      method: "POST";
      headers: Record<string, string>;
      body: {
        player_species_id: string;
        client_request_id: string;
        difficulty?: BattleDifficulty;
      };
    }
  | {
      type: "mutation";
      operation: "roll" | "action" | "surrender";
      url: string;
      method: "POST";
      headers: Record<string, string>;
      body: {
        client_request_id: string;
        expected_version: number;
        action?: BattleActionType;
      };
    };

// Strict validation of server combatant structure
function validateCombatant(raw: any): BattleCombatant | null {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.species_id !== "string" || !raw.species_id) return null;
  if (typeof raw.name !== "string" || !raw.name) return null;
  if (typeof raw.category !== "string") return null;
  if (typeof raw.role !== "string") return null;

  if (typeof raw.energy !== "number" || !Number.isFinite(raw.energy)) return null;
  if (typeof raw.max_energy !== "number" || !Number.isFinite(raw.max_energy)) return null;
  if (typeof raw.base_attack !== "number" || !Number.isFinite(raw.base_attack)) return null;
  if (typeof raw.shield !== "number" || !Number.isFinite(raw.shield)) return null;

  if (!Array.isArray(raw.statuses)) return null;
  if (typeof raw.action_count !== "number" || !Number.isFinite(raw.action_count)) return null;
  if (!Array.isArray(raw.abilities)) return null;

  return {
    species_id: raw.species_id,
    name: raw.name,
    category: raw.category,
    role: raw.role,
    energy: raw.energy,
    max_energy: raw.max_energy,
    base_attack: raw.base_attack,
    shield: raw.shield,
    statuses: raw.statuses,
    action_count: raw.action_count,
    abilities: raw.abilities,
    passive: raw.passive && typeof raw.passive === "object" ? raw.passive : null,
    passive_definition:
      raw.passive_definition && typeof raw.passive_definition === "object"
        ? raw.passive_definition
        : undefined,
    unlocked_abilities: Array.isArray(raw.unlocked_abilities)
      ? raw.unlocked_abilities.filter((n: any) => typeof n === "number")
      : undefined,
    passive_triggers: typeof raw.passive_triggers === "number" ? raw.passive_triggers : undefined,
    reroll_ready: typeof raw.reroll_ready === "boolean" ? raw.reroll_ready : undefined,
    lucky_bonus: Array.isArray(raw.lucky_bonus) ? raw.lucky_bonus : undefined,
  };
}

function validateActionPreview(raw: any): ActionPreview | null {
  if (!raw || typeof raw !== "object") return null;
  const validActions: BattleActionType[] = ["basic", "brace", "active_1", "active_2"];
  if (!validActions.includes(raw.action)) return null;
  if (typeof raw.name !== "string" || !raw.name) return null;
  if (!Array.isArray(raw.effects)) return null;
  if (typeof raw.damage !== "number" || !Number.isFinite(raw.damage)) return null;
  if (typeof raw.shield_absorbed !== "number" || !Number.isFinite(raw.shield_absorbed)) return null;
  if (typeof raw.healing !== "number" || !Number.isFinite(raw.healing)) return null;
  if (typeof raw.shield_gain !== "number" || !Number.isFinite(raw.shield_gain)) return null;
  if (!Array.isArray(raw.statuses)) return null;
  if (typeof raw.wasted_healing !== "number" || !Number.isFinite(raw.wasted_healing)) return null;
  if (typeof raw.wasted_shield !== "number" || !Number.isFinite(raw.wasted_shield)) return null;
  if (typeof raw.lucky_bonus_damage !== "number" || !Number.isFinite(raw.lucky_bonus_damage)) return null;
  if (typeof raw.will_end_battle !== "boolean") return null;
  if (typeof raw.summary !== "string") return null;
  if (typeof raw.lucky_summary !== "string") return null;

  return {
    action: raw.action,
    name: raw.name,
    effects: raw.effects,
    damage: raw.damage,
    shield_absorbed: raw.shield_absorbed,
    healing: raw.healing,
    shield_gain: raw.shield_gain,
    statuses: raw.statuses,
    wasted_healing: raw.wasted_healing,
    wasted_shield: raw.wasted_shield,
    lucky_bonus_damage: raw.lucky_bonus_damage,
    will_end_battle: raw.will_end_battle,
    summary: raw.summary,
    lucky_summary: raw.lucky_summary,
  };
}

// Strict validation of server battle state
function validateBattleState(raw: any): BattleState | null {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.battle_id !== "string" || !raw.battle_id) return null;
  if (typeof raw.version !== "number" || !Number.isFinite(raw.version) || raw.version < 0) {
    return null;
  }
  if (typeof raw.round !== "number" || !Number.isFinite(raw.round) || raw.round < 1) {
    return null;
  }

  const validPhases: BattlePhase[] = ["roll", "player_turn", "outcome"];
  if (!validPhases.includes(raw.phase)) return null;

  if (raw.active_side !== "player" && raw.active_side !== "opponent") return null;

  const player = validateCombatant(raw.player);
  const opponent = validateCombatant(raw.opponent);
  if (!player || !opponent) return null;

  if (raw.current_roll !== null && (typeof raw.current_roll !== "number" || !Number.isFinite(raw.current_roll))) {
    return null;
  }

  if (typeof raw.lucky !== "boolean") return null;

  if (!Array.isArray(raw.legal_actions)) return null;
  const legalActions: BattleActionType[] = [];
  for (const act of raw.legal_actions) {
    if (act === "basic" || act === "brace" || act === "active_1" || act === "active_2") {
      legalActions.push(act);
    }
  }

  const validOutcomes: BattleOutcomeType[] = [null, "win", "lose", "surrender", "draw"];
  const outcome = raw.outcome === undefined ? null : raw.outcome;
  if (!validOutcomes.includes(outcome)) return null;

  let previews: ActionPreview[] | undefined = undefined;
  if (raw.action_previews !== undefined) {
    if (!Array.isArray(raw.action_previews)) return null;
    const list: ActionPreview[] = [];
    for (const item of raw.action_previews) {
      const validPreview = validateActionPreview(item);
      if (!validPreview) return null;
      list.push(validPreview);
    }
    previews = list;
  }

  return {
    battle_id: raw.battle_id,
    version: raw.version,
    round: raw.round,
    phase: raw.phase,
    active_side: raw.active_side,
    player,
    opponent,
    current_roll: raw.current_roll,
    lucky: raw.lucky,
    legal_actions: legalActions,
    outcome,
    event_seq: typeof raw.event_seq === "number" ? raw.event_seq : undefined,
    initiative: raw.initiative === "player" || raw.initiative === "opponent" ? raw.initiative : undefined,
    difficulty: raw.difficulty === "standard" || raw.difficulty === "practice" ? raw.difficulty : undefined,
    power_ratio: typeof raw.power_ratio === "number" ? raw.power_ratio : undefined,
    action_previews: previews,
    rules_version: typeof raw.rules_version === "string" ? raw.rules_version : undefined,
  };
}

// Strict validation of event
function validateBattleEvent(raw: any): BattleEvent | null {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.id !== "number" || !Number.isFinite(raw.id)) return null;
  if (typeof raw.type !== "string" || !raw.type) return null;
  if (typeof raw.message !== "string") return null;

  const event: BattleEvent = {
    id: raw.id,
    type: raw.type,
    message: raw.message,
    vfx: typeof raw.vfx === "string" ? raw.vfx : "",
  };

  if (raw.side === "player" || raw.side === "opponent") {
    event.side = raw.side;
  }
  if (raw.target === "player" || raw.target === "opponent") {
    event.target = raw.target;
  }
  if (typeof raw.action === "string") {
    event.action = raw.action;
  }
  if (typeof raw.value === "number" && Number.isFinite(raw.value)) {
    event.value = raw.value;
  }
  if (typeof raw.roll === "number" && Number.isFinite(raw.roll)) {
    event.roll = raw.roll;
  }
  if (typeof raw.lucky === "boolean") {
    event.lucky = raw.lucky;
  }
  if (raw.snapshot && typeof raw.snapshot === "object") {
    const sPlayer = validateCombatant(raw.snapshot.player);
    const sOpponent = validateCombatant(raw.snapshot.opponent);
    if (sPlayer && sOpponent) {
      event.snapshot = { player: sPlayer, opponent: sOpponent };
    }
  }

  return event;
}

function generateRequestId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${ts}_${rand}`;
}

const EVENT_PLAYBACK_DELAY_MS = 180;
const REQUEST_TIMEOUT_MS = 15000;

export function useBattleSession({
  apiBase,
  childId,
  token,
  selectedSpecies,
  difficulty = "standard",
  active = true,
  onSessionExpired,
  onXpAwarded,
}: UseBattleSessionOptions) {
  const [state, setState] = useState<BattleState | null>(null);
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<BattleEvent | null>(null);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Generation counter to discard outdated async callbacks and presentation runs
  const generationRef = useRef(0);
  const isMountedRef = useRef(true);

  // Request lock: prevents overlapping network requests
  const networkInProgressRef = useRef(false);

  // Presentation lock: prevents action dispatching while event queue is playing back
  const presentationInProgressRef = useRef(false);

  // Stored pending network mutation for deterministic retries
  const pendingCommandRef = useRef<StoredCommand | null>(null);

  // Active timeout abort controller
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Active timers for cleanup
  const activeTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Track if XP callback has been fired for current battle
  const xpAwardedRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    for (const timer of activeTimersRef.current) {
      clearTimeout(timer);
    }
    activeTimersRef.current.clear();
  }, []);

  const abortPendingRequest = useCallback(() => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
  }, []);

  const resetAllState = useCallback(() => {
    generationRef.current += 1;
    abortPendingRequest();
    clearAllTimers();
    networkInProgressRef.current = false;
    presentationInProgressRef.current = false;
    pendingCommandRef.current = null;
    xpAwardedRef.current = null;

    setState(null);
    setEvents([]);
    setLatestEvent(null);
    setXpAwarded(null);
    setLoading(false);
    setRolling(false);
    setActionInProgress(false);
    setError(null);
  }, [abortPendingRequest, clearAllTimers]);

  // Mount/unmount lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      generationRef.current += 1;
      abortPendingRequest();
      clearAllTimers();
    };
  }, [abortPendingRequest, clearAllTimers]);

  // When active becomes false or childId / token changes, cancel requests, clear queues, invalidate generation
  useEffect(() => {
    resetAllState();
  }, [active, childId, token, resetAllState]);

  // Accessibility reduced motion check
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMountedRef.current) setReducedMotion(enabled);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      if (isMountedRef.current) setReducedMotion(enabled);
    });

    return () => {
      sub?.remove?.();
    };
  }, []);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  // Sequential event playback queue with snapshot application
  const playEventQueue = useCallback(
    async (
      incomingEvents: BattleEvent[],
      finalState: BattleState,
      awardedXp: number | null,
      totalXp: number | null,
      gen: number
    ) => {
      if (incomingEvents.length === 0) {
        if (generationRef.current !== gen || !isMountedRef.current) return;
        setState(finalState);
        if (awardedXp != null) {
          setXpAwarded(awardedXp);
        }
        if (totalXp != null && xpAwardedRef.current !== totalXp) {
          xpAwardedRef.current = totalXp;
          if (onXpAwarded) onXpAwarded(totalXp);
        }
        presentationInProgressRef.current = false;
        setActionInProgress(false);
        setRolling(false);
        return;
      }

      presentationInProgressRef.current = true;

      // Seed initial local state from first snapshot if available so opening action is visible without invented state
      if (incomingEvents.length > 0) {
        if (incomingEvents[0].snapshot) {
          const firstSnap = incomingEvents[0].snapshot;
          setState({
            ...finalState,
            player: firstSnap.player,
            opponent: firstSnap.opponent,
          });
        } else {
          setState(finalState);
        }
      }

      // If reduced motion is requested, apply immediately without staggered timeouts
      if (reducedMotion) {
        if (generationRef.current !== gen || !isMountedRef.current) return;
        setEvents((prev) => [...prev, ...incomingEvents]);
        const lastEvt = incomingEvents[incomingEvents.length - 1];
        setLatestEvent(lastEvt);
        setState(finalState);
        if (awardedXp != null) {
          setXpAwarded(awardedXp);
        }
        if (totalXp != null && xpAwardedRef.current !== totalXp) {
          xpAwardedRef.current = totalXp;
          if (onXpAwarded) onXpAwarded(totalXp);
        }
        presentationInProgressRef.current = false;
        setActionInProgress(false);
        setRolling(false);
        return;
      }

      for (let i = 0; i < incomingEvents.length; i++) {
        if (generationRef.current !== gen || !isMountedRef.current) {
          presentationInProgressRef.current = false;
          return;
        }

        const evt = incomingEvents[i];
        setEvents((prev) => [...prev, evt]);
        setLatestEvent(evt);

        // Animate snapshot onto local state during sequence
        if (evt.snapshot) {
          setState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              player: evt.snapshot!.player,
              opponent: evt.snapshot!.opponent,
            };
          });
        }

        // Wait ~180ms delay between events
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            activeTimersRef.current.delete(timer);
            resolve();
          }, EVENT_PLAYBACK_DELAY_MS);
          activeTimersRef.current.add(timer);
        });
      }

      if (generationRef.current !== gen || !isMountedRef.current) {
        presentationInProgressRef.current = false;
        return;
      }

      // Publish final authoritative state after queue finishes
      setState(finalState);
      if (awardedXp != null) {
        setXpAwarded(awardedXp);
      }
      if (totalXp != null && xpAwardedRef.current !== totalXp) {
        xpAwardedRef.current = totalXp;
        if (onXpAwarded) onXpAwarded(totalXp);
      }

      presentationInProgressRef.current = false;
      setActionInProgress(false);
      setRolling(false);
    },
    [onXpAwarded, reducedMotion]
  );

  // Sync state on 409 Conflict via GET /api/v1/battles/{id}
  const resyncServerState = useCallback(
    async (battleId: string, gen: number) => {
      try {
        const controller = new AbortController();
        activeAbortControllerRef.current = controller;
        const res = await fetch(`${apiBase}/api/v1/battles/${battleId}`, {
          method: "GET",
          headers: getHeaders(),
          signal: controller.signal,
        });

        if (generationRef.current !== gen || !isMountedRef.current) return;

        if (res.status === 401) {
          if (onSessionExpired) await onSessionExpired();
          setError("Your session has expired. Please log in again.");
          return;
        }
        if (res.status === 410) {
          resetAllState();
          setError("Battle session has expired. Please start a new battle.");
          return;
        }
        if (res.status === 403) {
          setError("You do not have permission to access this battle session.");
          return;
        }

        if (!res.ok) {
          setError("Could not resynchronize battle state with server.");
          return;
        }

        const data = await res.json();
        const validState = validateBattleState(data.state);
        if (validState) {
          if (generationRef.current !== gen || !isMountedRef.current) return;
          setState(validState);
          if (typeof data.xp_awarded === 'number') setXpAwarded(data.xp_awarded);
          if (typeof data.total_xp === 'number') onXpAwarded?.(data.total_xp);
          pendingCommandRef.current = null;
          setError(null);
        } else {
          setError("Server returned an unrecognized battle state during resync.");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (generationRef.current === gen && isMountedRef.current) {
          setError("Failed to resynchronize battle state.");
        }
      } finally {
        activeAbortControllerRef.current = null;
      }
    },
    [apiBase, getHeaders, onSessionExpired, onXpAwarded, resetAllState]
  );

  // Core executor for start & mutations
  const executeCommand = useCallback(
    async (command: StoredCommand, gen: number): Promise<boolean> => {
      if (generationRef.current !== gen || !isMountedRef.current) return false;

      networkInProgressRef.current = true;
      setError(null);

      const controller = new AbortController();
      activeAbortControllerRef.current = controller;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      try {
        const res = await fetch(command.url, {
          method: command.method,
          headers: command.headers,
          body: JSON.stringify(command.body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (generationRef.current !== gen || !isMountedRef.current) return false;

        // 401 Unauthorized -> trigger session expiration
        if (res.status === 401) {
          if (onSessionExpired) await onSessionExpired();
          setError("Your session has expired. Please log in again.");
          return false;
        }

        // 410 Gone -> session expired on server, clear and prompt restart
        if (res.status === 410) {
          resetAllState();
          setError("Battle session has expired. Please start a new battle.");
          return false;
        }

        // 403 Forbidden -> permission error, show error without logging out
        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.detail || "Explorer does not have permission for this battle.");
          return false;
        }

        // 409 Conflict -> resynchronize state via GET if mutation
        if (res.status === 409) {
          if (command.type === "mutation" && state?.battle_id) {
            await resyncServerState(state.battle_id, gen);
          } else {
            const errData = await res.json().catch(() => ({}));
            setError(errData.detail || "Conflict updating battle session. Please retry.");
          }
          return false;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.detail || `Server returned error (${res.status})`;
          setError(errMsg);
          return false;
        }

        const data: BattleSessionResponse = await res.json();
        if (generationRef.current !== gen || !isMountedRef.current) return false;

        // Validate state
        const validState = validateBattleState(data.state);
        if (!validState) {
          setError("Server returned an invalid battle state structure.");
          return false;
        }

        if (validState.action_previews === undefined && Array.isArray((data as any).action_previews)) {
          const rootPreviews: ActionPreview[] = [];
          for (const item of (data as any).action_previews) {
            const valid = validateActionPreview(item);
            if (!valid) {
              setError("Server returned an invalid action preview structure.");
              return false;
            }
            rootPreviews.push(valid);
          }
          validState.action_previews = rootPreviews;
        }

        // Validate events
        const rawEvents = Array.isArray(data.events) ? data.events : [];
        const validEvents: BattleEvent[] = [];
        for (const rawEvt of rawEvents) {
          const validEvt = validateBattleEvent(rawEvt);
          if (validEvt) validEvents.push(validEvt);
        }

        // Successful execution: clear pending retry command
        pendingCommandRef.current = null;
        if (command.type === "start") {
          setLoading(false);
        }

        // Staggered playback through queue
        await playEventQueue(
          validEvents,
          validState,
          data.xp_awarded ?? null,
          data.total_xp ?? null,
          gen
        );

        return true;
      } catch (err: any) {
        if (err.name === "AbortError") {
          if (generationRef.current === gen && isMountedRef.current) {
            setError("Request timed out. You can tap Retry to try again.");
          }
        } else {
          if (generationRef.current === gen && isMountedRef.current) {
            setError(err.message || "Network error occurred during battle operation.");
          }
        }
        return false;
      } finally {
        clearTimeout(timeoutId);
        activeAbortControllerRef.current = null;
        if (generationRef.current === gen && isMountedRef.current) {
          networkInProgressRef.current = false;
          setLoading(false);
          // Rolling and actionInProgress are kept true during playback and cleared by playEventQueue
          if (!presentationInProgressRef.current) {
            setRolling(false);
            setActionInProgress(false);
          }
        }
      }
    },
    [getHeaders, onSessionExpired, playEventQueue, resetAllState, resyncServerState, state?.battle_id]
  );

  // 1. Start battle session
  const startBattle = useCallback(
    async (speciesToUse?: Species | null, difficultyToUse?: BattleDifficulty): Promise<boolean> => {
      const species = speciesToUse || selectedSpecies;
      const diff = difficultyToUse || difficulty;
      if (!species || !active) return false;
      if (networkInProgressRef.current || presentationInProgressRef.current || pendingCommandRef.current) return false;

      // Invalidate existing operations and generate new generation id
      generationRef.current += 1;
      const gen = generationRef.current;

      abortPendingRequest();
      clearAllTimers();
      presentationInProgressRef.current = false;
      xpAwardedRef.current = null;

      setLoading(true);
      setError(null);
      setEvents([]);
      setLatestEvent(null);
      setXpAwarded(null);
      setState(null);

      const clientRequestId = generateRequestId("start");
      const command: StoredCommand = {
        type: "start",
        url: `${apiBase}/api/v1/children/${childId}/battles`,
        method: "POST",
        headers: getHeaders(),
        body: {
          player_species_id: species.id,
          client_request_id: clientRequestId,
          difficulty: diff,
        },
      };

      pendingCommandRef.current = command;
      return await executeCommand(command, gen);
    },
    [active, apiBase, childId, difficulty, executeCommand, getHeaders, selectedSpecies, abortPendingRequest, clearAllTimers]
  );

  // 2. Roll dice
  const rollDice = useCallback(async (): Promise<boolean> => {
    if (!state || !active) return false;
    if (state.phase !== "roll" || state.outcome !== null) return false;
    if (networkInProgressRef.current || presentationInProgressRef.current || pendingCommandRef.current) return false;

    const gen = generationRef.current;
    setRolling(true);
    setError(null);

    const clientRequestId = generateRequestId("roll");
    const command: StoredCommand = {
      type: "mutation",
      operation: "roll",
      url: `${apiBase}/api/v1/battles/${state.battle_id}/roll`,
      method: "POST",
      headers: getHeaders(),
      body: {
        client_request_id: clientRequestId,
        expected_version: state.version,
      },
    };

    pendingCommandRef.current = command;
    return await executeCommand(command, gen);
  }, [active, apiBase, executeCommand, getHeaders, state]);

  // 3. Perform combat action
  const performAction = useCallback(
    async (action: BattleActionType): Promise<boolean> => {
      if (!state || !active) return false;
      if (state.phase !== "player_turn" || state.outcome !== null) return false;
      if (!state.legal_actions.includes(action)) {
        setError(`Action ${action} is not legal for this roll.`);
        return false;
      }
      if (networkInProgressRef.current || presentationInProgressRef.current || pendingCommandRef.current) return false;

      const gen = generationRef.current;
      setActionInProgress(true);
      setError(null);

      const clientRequestId = generateRequestId("act");
      const command: StoredCommand = {
        type: "mutation",
        operation: "action",
        url: `${apiBase}/api/v1/battles/${state.battle_id}/action`,
        method: "POST",
        headers: getHeaders(),
        body: {
          client_request_id: clientRequestId,
          expected_version: state.version,
          action,
        },
      };

      pendingCommandRef.current = command;
      return await executeCommand(command, gen);
    },
    [active, apiBase, executeCommand, getHeaders, state]
  );

  // 4. Surrender
  const surrender = useCallback(async (): Promise<boolean> => {
    if (!state || !active) return false;
    if (state.outcome !== null) return false;
    if (networkInProgressRef.current || presentationInProgressRef.current || pendingCommandRef.current) return false;

    const gen = generationRef.current;
    setActionInProgress(true);
    setError(null);

    const clientRequestId = generateRequestId("surrender");
    const command: StoredCommand = {
      type: "mutation",
      operation: "surrender",
      url: `${apiBase}/api/v1/battles/${state.battle_id}/surrender`,
      method: "POST",
      headers: getHeaders(),
      body: {
        client_request_id: clientRequestId,
        expected_version: state.version,
      },
    };

    pendingCommandRef.current = command;
    return await executeCommand(command, gen);
  }, [active, apiBase, executeCommand, getHeaders, state]);

  // 5. Retry failed command with EXACT same ID and payload
  const retry = useCallback(async (): Promise<boolean> => {
    if (!pendingCommandRef.current || !active) return false;
    if (networkInProgressRef.current || presentationInProgressRef.current) return false;

    const command = pendingCommandRef.current;
    const gen = generationRef.current;

    if (command.type === "start") {
      setLoading(true);
    } else if (command.operation === "roll") {
      setRolling(true);
    } else {
      setActionInProgress(true);
    }

    return await executeCommand(command, gen);
  }, [active, executeCommand]);

  // Error classification helpers for UI recovery
  const isNetworkError =
    error !== null &&
    (error.includes("timed out") ||
      error.includes("Network error") ||
      error.includes("fetch") ||
      error.includes("network"));
  const isConflictError =
    error !== null &&
    (error.includes("Conflict") ||
      error.includes("state has changed") ||
      error.includes("busy") ||
      error.includes("409"));
  const isExpiredError =
    error !== null &&
    (error.includes("expired") ||
      error.includes("session has expired") ||
      error.includes("410"));
  const is400ClientError =
    error !== null &&
    (error.includes("(400)") ||
      error.includes("legal for this roll") ||
      error.includes("not legal") ||
      error.includes("Invalid"));

  const canRetry = Boolean(
    pendingCommandRef.current &&
      isNetworkError &&
      !presentationInProgressRef.current &&
      !networkInProgressRef.current
  );
  const canRefresh = Boolean(
    state?.battle_id &&
      isConflictError &&
      !presentationInProgressRef.current &&
      !networkInProgressRef.current
  );
  const canRestart = Boolean(
    !canRetry &&
      !canRefresh &&
      (isExpiredError || (!state && !loading && !networkInProgressRef.current)) &&
      !is400ClientError
  );

  const refreshState = useCallback(async () => {
    if (state?.battle_id) {
      await resyncServerState(state.battle_id, generationRef.current);
    }
  }, [resyncServerState, state?.battle_id]);

  return {
    state,
    events,
    latestEvent,
    xpAwarded,
    loading,
    rolling,
    actionInProgress: actionInProgress || presentationInProgressRef.current,
    error,
    canRetry,
    canRefresh,
    canRestart,
    reducedMotion,
    startBattle,
    rollDice,
    performAction,
    surrender,
    retry,
    refreshState,
    reset: resetAllState,
    clearError: () => setError(null),
  };
}
