import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../constants/fonts";
import { useAbilityQuizStore } from "../../../store/useAbilityQuizStore";
import { GameScreenHeader } from "../../common/game/GameScreenHeader";
import { DetailCard } from "./components/detail/DetailCard";
import { DETAIL_COLORS } from "./components/detail/detailTheme";
import { TabStatus } from "./components/detail/TabStatus";
import { QuizFooter } from "./components/quiz/QuizFooter";
import { QuizOption } from "./components/quiz/QuizOption";
import { QuizGiveUpConfirmModal } from "./components/QuizGiveUpConfirmModal";
import { QuizResultModal } from "./components/QuizResultModal";
import { QuizStepIndicator } from "./components/QuizStepIndicator";

export function AbilityQuizScreen() {
  const insets = useSafeAreaInsets();
  const questions = useAbilityQuizStore((state) => state.questions);
  const currentIndex = useAbilityQuizStore((state) => state.currentIndex);
  const answers = useAbilityQuizStore((state) => state.answers);
  const loadingQuiz = useAbilityQuizStore((state) => state.loadingQuiz);
  const submitting = useAbilityQuizStore((state) => state.submitting);
  const errorMsg = useAbilityQuizStore((state) => state.errorMsg);

  const currentQuestion = questions[currentIndex];
  const selected = currentQuestion ? answers[currentQuestion.id] : undefined;
  const quiz = useAbilityQuizStore.getState;

  // Backing out of the first question (or the header) asks before quitting.
  const goBack = () =>
    currentIndex === 0 ? quiz().openGiveUpConfirm() : quiz().goPrevious();

  return (
    <View style={styles.root}>
      <GameScreenHeader
        title="Prove Your Knowledge!"
        onBack={() => quiz().openGiveUpConfirm()}
      />

      {questions.length > 0 && (
        <QuizStepIndicator
          total={questions.length}
          current={currentIndex + 1}
        />
      )}

      <View
        style={[
          styles.body,
          { paddingBottom: 16 + insets.bottom },
          questions.length === 0 && styles.bodySpaced,
        ]}
      >
        <DetailCard style={styles.card}>
          {loadingQuiz ? (
            <TabStatus loading message="Getting your questions ready..." />
          ) : errorMsg ? (
            <TabStatus message={errorMsg} />
          ) : currentQuestion ? (
            <>
              <ScrollView
                contentContainerStyle={styles.question}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.header}>
                  <View style={styles.stepPill}>
                    <Text style={styles.stepPillText}>
                      Question {currentIndex + 1} of {questions.length}
                    </Text>
                  </View>
                  <Text style={styles.questionText}>
                    {currentQuestion.question}
                  </Text>
                </View>
                {currentQuestion.options.map((option, i) => (
                  <QuizOption
                    key={i}
                    label={option}
                    selected={selected === option}
                    onPress={() => quiz().selectAnswer(option)}
                  />
                ))}
              </ScrollView>
              <QuizFooter
                isLastQuestion={currentIndex === questions.length - 1}
                canContinue={Boolean(selected)}
                submitting={submitting}
                onBack={goBack}
                onNext={() => quiz().goNext()}
              />
            </>
          ) : null}
        </DetailCard>
      </View>

      <QuizGiveUpConfirmModal />
      <QuizResultModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DETAIL_COLORS.background },
  body: { flex: 1, paddingHorizontal: 16 },
  bodySpaced: { paddingTop: 16 },
  card: { flex: 1, paddingTop: 20, paddingBottom: 18, paddingHorizontal: 18 },
  question: { gap: 12, paddingBottom: 4 },
  header: { gap: 8 },
  stepPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: DETAIL_COLORS.green,
    borderRadius: 999,
  },
  stepPillText: { fontFamily: FONTS.bodyBlack, color: "#FFFFFF", fontSize: 12 },
  questionText: {
    fontFamily: FONTS.display,
    color: DETAIL_COLORS.ink,
    fontSize: 20,
  },
});
