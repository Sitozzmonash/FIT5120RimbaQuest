import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAbilityQuizStore } from "../../../store/useAbilityQuizStore";
import { Tap } from "../../common/Tap";
import { QuizStepIndicator } from "./components/QuizStepIndicator";
import { QuizGiveUpConfirmModal } from "./components/QuizGiveUpConfirmModal";
import { QuizResultModal } from "./components/QuizResultModal";

export function AbilityQuizScreen() {
  const questions = useAbilityQuizStore((state) => state.questions);
  const currentIndex = useAbilityQuizStore((state) => state.currentIndex);
  const answers = useAbilityQuizStore((state) => state.answers);
  const loadingQuiz = useAbilityQuizStore((state) => state.loadingQuiz);
  const submitting = useAbilityQuizStore((state) => state.submitting);
  const errorMsg = useAbilityQuizStore((state) => state.errorMsg);

  const currentQuestion = questions[currentIndex];
  const selected = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <View style={styles.root}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Animal Quiz
        </Text>
        <Tap
          label="Stop this quiz"
          style={styles.giveUpBtn}
          onPress={() => useAbilityQuizStore.getState().openGiveUpConfirm()}
        >
          <Text style={styles.giveUpBtnText}>Stop</Text>
        </Tap>
      </View>

      {questions.length > 0 && (
        <QuizStepIndicator
          total={questions.length}
          current={currentIndex + 1}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {loadingQuiz ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0A4D26" />
            <Text style={styles.hintText}>Getting your questions ready...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : currentQuestion ? (
          <View style={styles.questionBlock}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            <View style={styles.choices}>
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selected === opt;
                return (
                  <Tap
                    key={i}
                    label={opt}
                    style={[
                      styles.choiceCard,
                      isSelected && styles.choiceCardSelected,
                    ]}
                    onPress={() =>
                      useAbilityQuizStore.getState().selectAnswer(opt)
                    }
                  >
                    <View
                      style={[
                        styles.radioDot,
                        isSelected && styles.radioDotSelected,
                      ]}
                    />
                    <Text
                      style={[
                        styles.choiceText,
                        isSelected && styles.choiceTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                  </Tap>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {currentQuestion && (
        <View style={styles.footer}>
          <Tap
            label="Back"
            style={styles.backBtn}
            onPress={() =>
              currentIndex === 0
                ? useAbilityQuizStore.getState().openGiveUpConfirm()
                : useAbilityQuizStore.getState().goPrevious()
            }
          >
            <Text style={styles.backBtnText}>Back</Text>
          </Tap>
          <Tap
            label={isLastQuestion ? "Check My Answers" : "Next"}
            style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
            disabled={!selected || submitting}
            onPress={() => useAbilityQuizStore.getState().goNext()}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.nextBtnText}>
                {isLastQuestion ? "Check My Answers" : "Next"}
              </Text>
            )}
          </Tap>
        </View>
      )}

      <QuizGiveUpConfirmModal />
      <QuizResultModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FCF9" },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { flex: 1, color: "#1A1A1A", fontSize: 22, fontWeight: "800" },
  giveUpBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: 100,
    paddingHorizontal: 12,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  giveUpBtnText: { color: "#DC2626", fontSize: 14, fontWeight: "800" },
  body: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingTop: 24,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  hintText: { fontSize: 13, color: "#6A776E" },
  errorBox: {
    backgroundColor: "#FFF6F6",
    borderWidth: 1,
    borderColor: "#F2C4C4",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#8C1D24",
    fontWeight: "700",
    textAlign: "center",
  },
  questionBlock: { gap: 12 },
  questionText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000000",
    lineHeight: 32,
  },
  choices: { gap: 10 },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 26,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "#F4F4F4",
  },
  choiceCardSelected: { backgroundColor: "#3FBE00" },
  radioDot: {
    width: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: "#98A2B3",
  },
  radioDotSelected: { backgroundColor: "#FFFFFF" },
  choiceText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#667085",
  },
  choiceTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: "#F8FCF9",
  },
  backBtn: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#0A4D26",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { color: "#0A4D26", fontSize: 16, fontWeight: "800" },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#0A4D26",
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
