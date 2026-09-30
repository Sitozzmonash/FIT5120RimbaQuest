import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "../constants/config";
import { useUserStore } from "../store/useUserStore";
import {
  WildlifeAction,
  WildlifeCardOption,
  WildlifeInvite,
  WildlifeLeaderboardEntry,
  WildlifeMatch,
  WildlifeMode,
  WildlifeRestCard,
} from "../types/wildlifeMatch";

type MatchResponse = { match: WildlifeMatch };
type CardPreviewResponse = { habitat: string; cards: WildlifeCardOption[] };
export type WildlifeServerClock = { serverEpochMs: number; receivedMonotonicMs: number };

export function monotonicNow(): number {
  return typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now();
}

function requestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

class WildlifeRequestError extends Error {
  constructor(message: string, readonly status: number, readonly matchId?: string) {
    super(message);
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof WildlifeRequestError) return error.message;
  return "Connection lost. Please try again.";
}

export function useWildlifeMatch() {
  const childId = useUserStore((state) => state.currentUser.id);
  const token = useUserStore((state) => state.accessToken);
  const [match, setMatch] = useState<WildlifeMatch | null>(null);
  const [serverClock, setServerClock] = useState<WildlifeServerClock | null>(null);
  const [invite, setInvite] = useState<WildlifeInvite | null>(null);
  const [cardOptions, setCardOptions] = useState<WildlifeCardOption[] | null>(null);
  const [restCards, setRestCards] = useState<WildlifeRestCard[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<WildlifeLeaderboardEntry[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restError, setRestError] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(true);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const generation = useRef(0);
  const latestMatch = useRef<{ id: string; version: number } | null>(null);
  const controllers = useRef(new Set<AbortController>());
  const mutationLocked = useRef(false);
  const requestIds = useRef(new Map<string, string>());
  const polling = useRef(false);

  const isCurrent = useCallback((captured: number) => generation.current === captured, []);

  const request = useCallback(async <T,>(path: string, body?: object): Promise<T> => {
    if (!childId || !token) throw new WildlifeRequestError("Please log in to battle.", 401);
    const captured = generation.current;
    const controller = new AbortController();
    controllers.current.add(controller);
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (!isCurrent(captured)) throw new Error("Request superseded");
      const data: unknown = await response.json().catch(() => ({}));
      if (response.status === 401) {
        void useUserStore.getState().expire();
        throw new WildlifeRequestError("Session expired. Please log in again.", 401);
      }
      if (!response.ok) {
        const detail = data && typeof data === "object" && "detail" in data
          ? (data as { detail: unknown }).detail
          : undefined;
        const detailObject = detail && typeof detail === "object" && !Array.isArray(detail)
          ? detail as Record<string, unknown>
          : null;
        const detailMessage = typeof detail === "string" ? detail : detailObject?.message;
        const message = typeof detailMessage === "string" && detailMessage.length < 180
          ? detailMessage
          : response.status === 409
            ? "The match has changed. Refresh and try again."
            : response.status === 410
              ? "This invitation has expired."
              : "That action could not be completed. Please try again.";
        const matchId = typeof detailObject?.match_id === "string" ? detailObject.match_id : undefined;
        throw new WildlifeRequestError(message, response.status, matchId);
      }
      return data as T;
    } finally {
      controllers.current.delete(controller);
    }
  }, [childId, token, isCurrent]);

  const applyMatch = useCallback((next: WildlifeMatch) => {
    const previous = latestMatch.current;
    if (previous?.id === next.id && previous.version > next.version) return;
    latestMatch.current = { id: next.id, version: next.version };
    const serverEpochMs = Date.parse(next.server_now);
    if (Number.isFinite(serverEpochMs)) {
      setServerClock({ serverEpochMs, receivedMonotonicMs: monotonicNow() });
    }
    setMatch(next);
  }, []);

  const refreshRest = useCallback(async () => {
    const captured = generation.current;
    try {
      const data = await request<{ cards: WildlifeRestCard[] }>("/api/v1/wildlife-battles/me/rest");
      if (isCurrent(captured)) {
        setRestCards(Array.isArray(data.cards) ? data.cards : []);
        setRestError(null);
      }
    } catch (caught) {
      if (isCurrent(captured)) setRestError(errorMessage(caught));
    }
  }, [request, isCurrent]);

  const refreshLeaderboard = useCallback(async () => {
    const captured = generation.current;
    try {
      const data = await request<{ entries: WildlifeLeaderboardEntry[] }>("/api/v1/wildlife-battles/leaderboard");
      if (isCurrent(captured)) {
        setLeaderboard(Array.isArray(data.entries) ? data.entries : []);
        setLeaderboardError(null);
      }
    } catch (caught) {
      if (isCurrent(captured)) setLeaderboardError(errorMessage(caught));
    }
  }, [request, isCurrent]);

  const refreshCardOptions = useCallback(async (target: { matchId?: string; code?: string }) => {
    const captured = generation.current;
    setCardOptions(null);
    const path = target.matchId
      ? `/api/v1/wildlife-battles/${encodeURIComponent(target.matchId)}/cards-preview`
      : `/api/v1/wildlife-battles/invites/${encodeURIComponent(target.code ?? "")}/cards-preview`;
    try {
      const data = await request<CardPreviewResponse>(path);
      if (isCurrent(captured)) {
        setCardOptions(Array.isArray(data.cards) ? data.cards : []);
        setError(null);
      }
    } catch (caught) {
      if (isCurrent(captured)) setError(errorMessage(caught));
    }
  }, [request, isCurrent]);

  const recoverCurrent = useCallback(async () => {
    const captured = generation.current;
    setRecovering(true);
    setRecoveryError(null);
    setError(null);
    try {
      const data = await request<{ match: WildlifeMatch | null }>("/api/v1/wildlife-battles/me/current");
      if (!isCurrent(captured)) return;
      setInvite(null);
      setCardOptions(null);
      if (data.match) {
        applyMatch(data.match);
        if (data.match.status === "setup") {
          await refreshCardOptions({ matchId: data.match.id });
        }
      } else {
        latestMatch.current = null;
        setMatch(null);
        setServerClock(null);
      }
    } catch (caught) {
      if (isCurrent(captured)) setRecoveryError(errorMessage(caught));
    } finally {
      if (isCurrent(captured)) setRecovering(false);
    }
  }, [request, isCurrent, applyMatch, refreshCardOptions]);

  const refreshMatch = useCallback(async (showError = true) => {
    if (!match?.id || polling.current) return;
    polling.current = true;
    const captured = generation.current;
    try {
      const data = await request<MatchResponse>(`/api/v1/wildlife-battles/${encodeURIComponent(match.id)}`);
      if (isCurrent(captured)) {
        applyMatch(data.match);
        if (showError) setError(null);
      }
    } catch (caught) {
      if (caught instanceof WildlifeRequestError && caught.status === 410 && isCurrent(captured)) {
        setMatch((previous) => previous?.id === match.id ? { ...previous, status: "expired" } : previous);
        return;
      }
      if (showError && isCurrent(captured)) setError(errorMessage(caught));
    } finally {
      polling.current = false;
    }
  }, [match?.id, request, isCurrent, applyMatch]);

  const mutate = useCallback(async (
    label: string,
    path: string,
    body: object,
    onSuccess?: (next: WildlifeMatch) => void,
  ): Promise<boolean> => {
    if (mutationLocked.current) return false;
    mutationLocked.current = true;
    const captured = generation.current;
    const requestKey = `${label}:${path}:${JSON.stringify(body)}`;
    const clientRequestId = requestIds.current.get(requestKey) ?? requestId();
    requestIds.current.set(requestKey, clientRequestId);
    setPending(label);
    setError(null);
    try {
      const data = await request<MatchResponse>(path, { ...body, client_request_id: clientRequestId });
      if (!isCurrent(captured)) return false;
      requestIds.current.delete(requestKey);
      applyMatch(data.match);
      onSuccess?.(data.match);
      return true;
    } catch (caught) {
      if (caught instanceof WildlifeRequestError && ![409, 503].includes(caught.status)) {
        requestIds.current.delete(requestKey);
      }
      if (isCurrent(captured)) {
        setError(errorMessage(caught));
        if (caught instanceof WildlifeRequestError && caught.status === 409) {
          if (caught.matchId) {
            setInvite(null);
            void recoverCurrent();
          } else {
            // A timeout or the other player may have advanced the match.
            void refreshMatch(false);
          }
        }
      }
      return false;
    } finally {
      mutationLocked.current = false;
      if (isCurrent(captured)) setPending(null);
    }
  }, [request, isCurrent, applyMatch, refreshMatch, recoverCurrent]);

  const start = useCallback(async (mode: WildlifeMode) => {
    if (recovering || recoveryError) return false;
    const success = await mutate("Creating match", "/api/v1/wildlife-battles", { mode }, (next) => {
      setInvite(null);
      void refreshCardOptions({ matchId: next.id });
    });
    return success;
  }, [mutate, refreshCardOptions, recovering, recoveryError]);

  const previewInvite = useCallback(async (rawCode: string) => {
    if (recovering || recoveryError) return false;
    if (mutationLocked.current) return false;
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      setError("Enter an invitation code first.");
      return false;
    }
    mutationLocked.current = true;
    setPending("Finding invitation");
    setError(null);
    const captured = generation.current;
    try {
      const data = await request<{ invite: WildlifeInvite }>(`/api/v1/wildlife-battles/invites/${encodeURIComponent(code)}`);
      if (!isCurrent(captured)) return false;
      if (data.invite.can_join === false) {
        setError("You cannot join your own invitation. Share the code with a friend.");
        return false;
      }
      setMatch(null);
      latestMatch.current = null;
      setInvite(data.invite);
      void refreshCardOptions({ code });
      return true;
    } catch (caught) {
      if (isCurrent(captured)) setError(errorMessage(caught));
      return false;
    } finally {
      mutationLocked.current = false;
      if (isCurrent(captured)) setPending(null);
    }
  }, [request, isCurrent, refreshCardOptions, recovering, recoveryError]);

  const selectCard = useCallback(async (speciesId: string) => {
    if (!match) return false;
    return mutate("Selecting card", `/api/v1/wildlife-battles/${encodeURIComponent(match.id)}/select`,
      { species_id: speciesId }, () => {
        setCardOptions(null);
        void refreshRest();
      });
  }, [match, mutate, refreshRest]);

  const joinInvite = useCallback(async (speciesId: string) => {
    if (!invite) return false;
    return mutate("Joining match", `/api/v1/wildlife-battles/invites/${encodeURIComponent(invite.code)}/join`,
      { species_id: speciesId }, () => {
        setInvite(null);
        setCardOptions(null);
        void refreshRest();
      });
  }, [invite, mutate, refreshRest]);

  const act = useCallback(async (action: WildlifeAction) => {
    if (!match) return false;
    return mutate("Playing turn", `/api/v1/wildlife-battles/${encodeURIComponent(match.id)}/action`,
      { action, expected_version: match.version });
  }, [match, mutate]);

  const forfeit = useCallback(async () => {
    if (!match) return false;
    return mutate("Leaving match", `/api/v1/wildlife-battles/${encodeURIComponent(match.id)}/forfeit`,
      { expected_version: match.version });
  }, [match, mutate]);

  const cancel = useCallback(async () => {
    if (!match || (match.status !== "setup" && match.status !== "waiting")) return false;
    return mutate("Canceling match", `/api/v1/wildlife-battles/${encodeURIComponent(match.id)}/cancel`,
      { expected_version: match.version });
  }, [match, mutate]);

  const clear = useCallback(() => {
    generation.current += 1;
    controllers.current.forEach((controller) => controller.abort());
    controllers.current.clear();
    polling.current = false;
    requestIds.current.clear();
    latestMatch.current = null;
    setMatch(null);
    setServerClock(null);
    setInvite(null);
    setCardOptions(null);
    setError(null);
    setRecovering(false);
    setRecoveryError(null);
    void refreshRest();
    void refreshLeaderboard();
  }, [refreshRest, refreshLeaderboard]);

  useEffect(() => {
    generation.current += 1;
    mutationLocked.current = false;
    polling.current = false;
    requestIds.current.clear();
    latestMatch.current = null;
    setMatch(null);
    setServerClock(null);
    setInvite(null);
    setCardOptions(null);
    setRestCards(null);
    setLeaderboard(null);
    setPending(null);
    setError(null);
    setRestError(null);
    setLeaderboardError(null);
    setRecovering(Boolean(childId && token));
    setRecoveryError(null);
    if (childId && token) {
      void refreshRest();
      void refreshLeaderboard();
      void recoverCurrent();
    }
    return () => {
      generation.current += 1;
      controllers.current.forEach((controller) => controller.abort());
      controllers.current.clear();
    };
  }, [childId, token, refreshRest, refreshLeaderboard, recoverCurrent]);

  useEffect(() => {
    if (match?.status !== "waiting" && match?.status !== "active") return;
    const timer = setInterval(() => void refreshMatch(false), 1000);
    return () => clearInterval(timer);
  }, [match?.id, match?.status, refreshMatch]);

  useEffect(() => {
    if (match?.status !== "completed") return;
    void refreshRest();
    void refreshLeaderboard();
  }, [match?.id, match?.status, refreshRest, refreshLeaderboard]);

  return {
    match,
    serverClock,
    invite,
    cardOptions,
    restCards,
    leaderboard,
    pending,
    error,
    restError,
    leaderboardError,
    recovering,
    recoveryError,
    start,
    previewInvite,
    selectCard,
    joinInvite,
    act,
    forfeit,
    cancel,
    clear,
    refreshMatch,
    refreshRest,
    refreshLeaderboard,
    refreshCardOptions,
    recoverCurrent,
  };
}
