import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Species } from "../../../../types";
import { Tap } from "../../../common/Tap";
import { PrimaryButton } from "../../../common/PrimaryButton";
import { API_BASE } from "../../../../constants/config";

interface Question {
  id: string;
  question: string;
  options: string[];
}

export function QuizTab({
  species,
  token,
}: {
  species: Species;
  token?: string | null;
}) {
  const [progression, setProgression] = useState<{
    easy_passed: boolean;
    medium_passed: boolean;
    hard_passed: boolean;
    unlocked_abilities: number[];
  }>({
    easy_passed: false,
    medium_passed: false,
    hard_passed: false,
    unlocked_abilities: [],
  });

  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [setIndex, setSetIndex] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    passed: boolean;
    ability_unlocked?: number | null;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProgression = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/species/${species.id}/quiz-progression`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProgression(data);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  };

  const loadQuiz = async (diff: "easy" | "medium" | "hard") => {
    setErrorMsg("");
    setQuizResult(null);
    setCurrentQIndex(0);
    setUserAnswers({});
    setLoading(true);
    setSelectedDifficulty(diff);

    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/species/${species.id}/quiz?difficulty=${diff}`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to load quiz" }));
        setErrorMsg(err.detail || "Quiz locked or unavailable.");
        setQuestions([]);
        return;
      }
      const data = await res.json();
      setQuestions(data.questions || []);
      setSetIndex(data.set_index || 0);
    } catch {
      setErrorMsg("Network error loading quiz.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgression().then(() => {
      loadQuiz("easy");
    });
  }, [species.id]);

  const handleSelectOption = (option: string) => {
    const q = questions[currentQIndex];
    if (!q) return;
    setUserAnswers((prev) => ({ ...prev, [q.id]: option }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/v1/species/${species.id}/quiz/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          difficulty: selectedDifficulty,
          set_index: setIndex,
          answers: userAnswers,
        }),
      });
      const data = await res.json();
      setQuizResult(data);
      if (data.passed) {
        await fetchProgression();
      }
    } catch {
      setErrorMsg("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentQIndex];
  const isSelected = (opt: string) => currentQ && userAnswers[currentQ.id] === opt;
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <View style={styles.container}>
      {/* 难度选择栏 */}
      <View style={styles.difficultyRow}>
        {(["easy", "medium", "hard"] as const).map((diff, idx) => {
          const isSelectedDiff = selectedDifficulty === diff;
          const isPassed =
            diff === "easy"
              ? progression.easy_passed
              : diff === "medium"
              ? progression.medium_passed
              : progression.hard_passed;

          const isLocked =
            (diff === "medium" && !progression.easy_passed) ||
            (diff === "hard" && !progression.medium_passed);

          return (
            <Tap
              key={diff}
              label={`Quiz ${diff}`}
              style={[
                styles.diffTab,
                isSelectedDiff && styles.diffTabActive,
                isLocked && styles.diffTabLocked,
              ]}
              onPress={() => loadQuiz(diff)}
            >
              <Text
                style={[
                  styles.diffTabText,
                  isSelectedDiff && styles.diffTabTextActive,
                  isLocked && styles.diffTabTextLocked,
                ]}
              >
                {diff.toUpperCase()} {isPassed ? "✓" : isLocked ? "🔒" : ""}
              </Text>
              <Text style={styles.diffAbilityHint}>
                Ability {idx + 1}
              </Text>
            </Tap>
          );
        })}
      </View>

      {/* 技能解锁进度概览 */}
      <View style={styles.unlockedBox}>
        <Text style={styles.unlockedTitle}>SPECIAL ABILITY PROGRESSION</Text>
        <View style={styles.abilitySlotsRow}>
          {[1, 2, 3].map((slot) => {
            const isUnlocked = progression.unlocked_abilities.includes(slot);
            return (
              <View
                key={slot}
                style={[styles.abilitySlotBadge, isUnlocked && styles.abilitySlotBadgeActive]}
              >
                <Text style={styles.abilitySlotBadgeIcon}>{isUnlocked ? "⚡" : "🔒"}</Text>
                <Text
                  style={[
                    styles.abilitySlotBadgeText,
                    isUnlocked && styles.abilitySlotBadgeTextActive,
                  ]}
                >
                  Ability {slot} {isUnlocked ? "Unlocked" : "Locked"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 状态或错误提示 */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2C6B4F" />
          <Text style={styles.hintText}>Loading verified quiz set...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.errorBox}>
          <MaterialIcons name="lock" size={24} color="#8C1D24" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : quizResult ? (
        /* 测验结果页 */
        <View style={styles.resultBox}>
          <Text style={styles.resultEmoji}>{quizResult.passed ? "🎉" : "💡"}</Text>
          <Text style={styles.resultTitle}>
            {quizResult.passed ? "Quiz Passed!" : "Almost there!"}
          </Text>
          <Text style={styles.resultScore}>
            Score: {quizResult.score} / {quizResult.total}
          </Text>
          <Text style={styles.resultMsg}>{quizResult.message}</Text>
          <PrimaryButton
            label={quizResult.passed ? "Try Next Level" : "Try Different Quiz Set"}
            icon="refresh"
            onPress={() => {
              if (quizResult.passed) {
                if (selectedDifficulty === "easy") loadQuiz("medium");
                else if (selectedDifficulty === "medium") loadQuiz("hard");
                else loadQuiz("hard");
              } else {
                loadQuiz(selectedDifficulty);
              }
            }}
          />
        </View>
      ) : questions.length > 0 && currentQ ? (
        /* 正在答题 */
        <View style={styles.questionCard}>
          <View style={styles.questionMetaRow}>
            <Text style={styles.progressCounter}>
              Question {currentQIndex + 1} of {questions.length}
            </Text>
            <Text style={styles.answeredCounter}>
              Answered {answeredCount}/{questions.length}
            </Text>
          </View>

          <Text style={styles.questionText}>{currentQ.question}</Text>

          <View style={styles.optionsWrap}>
            {currentQ.options.map((opt, i) => {
              const selected = isSelected(opt);
              return (
                <Tap
                  key={i}
                  label={opt}
                  style={[styles.optionBtn, selected && styles.optionBtnSelected]}
                  onPress={() => handleSelectOption(opt)}
                >
                  <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {opt}
                  </Text>
                </Tap>
              );
            })}
          </View>

          {/* 翻题与提交控制 */}
          <View style={styles.navigationRow}>
            {currentQIndex > 0 ? (
              <Tap
                label="Previous Question"
                style={styles.navBtn}
                onPress={() => setCurrentQIndex((i) => i - 1)}
              >
                <Text style={styles.navBtnText}>Previous</Text>
              </Tap>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {currentQIndex < questions.length - 1 ? (
              <Tap
                label="Next Question"
                style={[styles.navBtn, styles.navBtnPrimary]}
                onPress={() => setCurrentQIndex((i) => i + 1)}
              >
                <Text style={styles.navBtnPrimaryText}>Next</Text>
              </Tap>
            ) : (
              <PrimaryButton
                label="Submit Quiz"
                loading={submitting}
                disabled={answeredCount < questions.length}
                onPress={handleSubmitQuiz}
              />
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24, gap: 14 },
  difficultyRow: { flexDirection: "row", gap: 8 },
  diffTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E7E3",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  diffTabActive: {
    borderColor: "#2C6B4F",
    backgroundColor: "#F0F9F4",
  },
  diffTabLocked: {
    backgroundColor: "#F6F7F6",
    borderColor: "#EAEAEA",
    opacity: 0.6,
  },
  diffTabText: { fontSize: 13, fontWeight: "800", color: "#4A554D" },
  diffTabTextActive: { color: "#2C6B4F" },
  diffTabTextLocked: { color: "#9E9E9E" },
  diffAbilityHint: { fontSize: 10, color: "#7B857F", marginTop: 2 },
  unlockedBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E7E3",
    padding: 12,
    gap: 8,
  },
  unlockedTitle: { fontSize: 11, fontWeight: "800", color: "#6A776E", letterSpacing: 0.5 },
  abilitySlotsRow: { flexDirection: "row", gap: 6 },
  abilitySlotBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F5F4",
    borderWidth: 1,
    borderColor: "#E2E7E3",
  },
  abilitySlotBadgeActive: {
    backgroundColor: "#E6F4EA",
    borderColor: "#2C6B4F",
  },
  abilitySlotBadgeIcon: { fontSize: 12 },
  abilitySlotBadgeText: { fontSize: 10, fontWeight: "700", color: "#6A776E" },
  abilitySlotBadgeTextActive: { color: "#2C6B4F" },
  centerBox: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 10 },
  hintText: { fontSize: 13, color: "#6A776E" },
  errorBox: {
    backgroundColor: "#FFF6F6",
    borderWidth: 1,
    borderColor: "#F2C4C4",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  errorText: { fontSize: 13, color: "#8C1D24", fontWeight: "700", textAlign: "center" },
  resultBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#D2E8DB",
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  resultEmoji: { fontSize: 38 },
  resultTitle: { fontSize: 18, fontWeight: "800", color: "#1B211C" },
  resultScore: { fontSize: 16, fontWeight: "800", color: "#2C6B4F" },
  resultMsg: { fontSize: 13, color: "#4A554D", textAlign: "center", marginBottom: 8 },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E7E3",
    padding: 16,
    gap: 14,
  },
  questionMetaRow: { flexDirection: "row", justifyContent: "space-between" },
  progressCounter: { fontSize: 12, fontWeight: "800", color: "#2C6B4F" },
  answeredCounter: { fontSize: 12, color: "#7B857F" },
  questionText: { fontSize: 15, fontWeight: "700", color: "#1B211C", lineHeight: 22 },
  optionsWrap: { gap: 10 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8ECE9",
    backgroundColor: "#FAFBFB",
  },
  optionBtnSelected: {
    borderColor: "#2C6B4F",
    backgroundColor: "#F0F9F4",
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#BDC7C0",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: { borderColor: "#2C6B4F" },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2C6B4F" },
  optionText: { fontSize: 13, color: "#2A332C", flex: 1, fontWeight: "600" },
  optionTextSelected: { color: "#2C6B4F", fontWeight: "800" },
  navigationRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  navBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D5DCD7",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  navBtnText: { fontSize: 13, fontWeight: "700", color: "#4A554D" },
  navBtnPrimary: {
    backgroundColor: "#2C6B4F",
    borderColor: "#2C6B4F",
  },
  navBtnPrimaryText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
});
