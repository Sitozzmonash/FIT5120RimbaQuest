import { create } from "zustand";
import { API_BASE } from "../constants/config";
import { QuizDifficulty, QuizQuestion, QuizResult, Species } from "../types";
import { useContinueLearningStore } from "./useContinueLearningStore";
import { useNavigationStore } from "./useNavigationStore";
import { useUserStore } from "./useUserStore";

const DIFFICULTY_BY_SLOT: Record<number, QuizDifficulty> = {
  1: "easy",
  2: "medium",
  3: "hard",
};

export function difficultyLabel(difficulty: QuizDifficulty): string {
  return difficulty === "easy"
    ? "Easy"
    : difficulty === "medium"
      ? "Medium"
      : "Hard";
}

type AbilityQuizState = {
  progressionBySpecies: Record<string, number[]>;
  progressionLoadingSpecies: Record<string, boolean>;

  // "Unlock This Ability" confirmation modal
  unlockModalVisible: boolean;
  pendingSlot: number | null;
  pendingDifficulty: QuizDifficulty | null;
  pendingAbilityName: string;

  // The active challenge, once "Begin Challenge" is pressed
  activeSpecies: Species | null;
  activeDifficulty: QuizDifficulty | null;
  questions: QuizQuestion[];
  setIndex: number;
  currentIndex: number;
  answers: Record<string, string>;
  loadingQuiz: boolean;
  submitting: boolean;
  errorMsg: string;
  result: QuizResult | null;
  giveUpConfirmVisible: boolean;
};

type AbilityQuizActions = {
  fetchProgression: (speciesId: string) => Promise<void>;
  openUnlockModal: (species: Species, slot: number) => void;
  closeUnlockModal: () => void;
  beginChallenge: () => Promise<void>;
  selectAnswer: (option: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  submitQuiz: () => Promise<void>;
  retryQuiz: () => void;
  finishQuiz: () => void;
  openGiveUpConfirm: () => void;
  closeGiveUpConfirm: () => void;
  giveUp: () => void;
};

export type AbilityQuizStore = AbilityQuizState & AbilityQuizActions;

const progressionRequestSeq: Record<string, number> = {};

async function loadQuizQuestions(
  speciesId: string,
  difficulty: QuizDifficulty,
) {
  useAbilityQuizStore.setState({
    loadingQuiz: true,
    errorMsg: "",
    questions: [],
    currentIndex: 0,
    answers: {},
  });
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/species/${speciesId}/quiz?difficulty=${difficulty}`,
      { headers: useUserStore.getState().authHeaders() },
    );
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ detail: "Failed to load quiz" }));
      useAbilityQuizStore.setState({
        errorMsg: err.detail || "Quiz locked or unavailable.",
        loadingQuiz: false,
      });
      return;
    }
    const data = await res.json();
    useAbilityQuizStore.setState({
      questions: data.questions || [],
      setIndex: data.set_index || 0,
      loadingQuiz: false,
    });
  } catch {
    useAbilityQuizStore.setState({
      errorMsg: "Network error loading quiz.",
      loadingQuiz: false,
    });
  }
}

export const useAbilityQuizStore = create<AbilityQuizStore>((set, get) => ({
  progressionBySpecies: {},
  progressionLoadingSpecies: {},

  unlockModalVisible: false,
  pendingSlot: null,
  pendingDifficulty: null,
  pendingAbilityName: "",

  activeSpecies: null,
  activeDifficulty: null,
  questions: [],
  setIndex: 0,
  currentIndex: 0,
  answers: {},
  loadingQuiz: false,
  submitting: false,
  errorMsg: "",
  result: null,
  giveUpConfirmVisible: false,

  fetchProgression: async (speciesId) => {
    const hasCache = speciesId in get().progressionBySpecies;
    if (!hasCache) {
      set((state) => ({
        progressionLoadingSpecies: { ...state.progressionLoadingSpecies, [speciesId]: true },
      }));
    }

    const requestId = (progressionRequestSeq[speciesId] || 0) + 1;
    progressionRequestSeq[speciesId] = requestId;

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/species/${speciesId}/quiz-progression`,
        {
          headers: useUserStore.getState().authHeaders(),
        },
      );
      if (progressionRequestSeq[speciesId] !== requestId) return;
      if (res.ok) {
        const data = await res.json();
        if (
          progressionRequestSeq[speciesId] === requestId &&
          Array.isArray(data.unlocked_abilities)
        ) {
          set((state) => ({
            progressionBySpecies: {
              ...state.progressionBySpecies,
              [speciesId]: data.unlocked_abilities,
            },
          }));
        }
      }
    } catch {
      // Keep whatever's cached on a network error rather than guessing.
    } finally {
      if (progressionRequestSeq[speciesId] === requestId) {
        set((state) => {
          if (!(speciesId in state.progressionLoadingSpecies)) return state;
          const next = { ...state.progressionLoadingSpecies };
          delete next[speciesId];
          return { progressionLoadingSpecies: next };
        });
      }
    }
  },

  openUnlockModal: (species, slot) => {
    const abilityKey = `ability_${slot}` as
      | "ability_1"
      | "ability_2"
      | "ability_3";
    set({
      unlockModalVisible: true,
      pendingSlot: slot,
      pendingDifficulty: DIFFICULTY_BY_SLOT[slot] || "easy",
      pendingAbilityName: species[abilityKey] || `Ability ${slot}`,
      activeSpecies: species,
    });
  },

  closeUnlockModal: () => set({ unlockModalVisible: false }),

  beginChallenge: async () => {
    const { activeSpecies, pendingDifficulty } = get();
    if (!activeSpecies || !pendingDifficulty) return;
    set({
      unlockModalVisible: false,
      activeDifficulty: pendingDifficulty,
      result: null,
      giveUpConfirmVisible: false,
    });
    useNavigationStore.getState().open("quiz");
    await loadQuizQuestions(activeSpecies.id, pendingDifficulty);
  },

  selectAnswer: (option) => {
    const { questions, currentIndex, answers } = get();
    const q = questions[currentIndex];
    if (!q) return;
    set({ answers: { ...answers, [q.id]: option } });
  },

  goNext: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      void get().submitQuiz();
    }
  },

  goPrevious: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
  },

  submitQuiz: async () => {
    const { activeSpecies, activeDifficulty, setIndex, answers } = get();
    if (!activeSpecies || !activeDifficulty) return;
    set({ submitting: true, errorMsg: "" });
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/species/${activeSpecies.id}/quiz/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...useUserStore.getState().authHeaders(),
          },
          body: JSON.stringify({
            difficulty: activeDifficulty,
            set_index: setIndex,
            answers,
          }),
        },
      );
      const data = await res.json();
      set({ result: data, submitting: false });
      if (res.ok) {
        useContinueLearningStore
          .getState()
          .recordActivity(useUserStore.getState().currentUser.id, activeSpecies.id, "quiz");
      }
      if (data.passed) {
        await get().fetchProgression(activeSpecies.id);
      }
    } catch {
      set({
        submitting: false,
        errorMsg: "Failed to submit quiz. Please try again.",
      });
    }
  },

  retryQuiz: () => {
    const { activeSpecies, activeDifficulty } = get();
    if (!activeSpecies || !activeDifficulty) return;
    set({ result: null });
    void loadQuizQuestions(activeSpecies.id, activeDifficulty);
  },

  finishQuiz: () => {
    set({
      result: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      activeDifficulty: null,
      giveUpConfirmVisible: false,
      errorMsg: "",
    });
    useNavigationStore.getState().goBack();
  },

  openGiveUpConfirm: () => set({ giveUpConfirmVisible: true }),
  closeGiveUpConfirm: () => set({ giveUpConfirmVisible: false }),

  giveUp: () => get().finishQuiz(),
}));
