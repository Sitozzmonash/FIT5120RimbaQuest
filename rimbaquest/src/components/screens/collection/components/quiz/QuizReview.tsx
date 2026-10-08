import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../../../constants/fonts";
import { useAbilityQuizStore } from "../../../../../store/useAbilityQuizStore";
import { QuizResult } from "../../../../../types";
import { GameButton } from "../../../../common/game/GameButton";
import { GameScreenHeader } from "../../../../common/game/GameScreenHeader";
import { DetailCard } from "../detail/DetailCard";
import { DETAIL_COLORS, fieldLabelStyle } from "../detail/detailTheme";
import { QuizStepIndicator } from "../QuizStepIndicator";
import { QuizOption } from "./QuizOption";

function sourceHint(
  source: NonNullable<QuizResult["review"]>[number] | undefined,
): string {
  if (!source) return "Review this animal's card for a clue.";
  if (source.source_type === "fun_fact") {
    const numbers = source.source_refs.filter(
      (ref): ref is number => typeof ref === "number",
    );
    return numbers.length
      ? `Read Fun ${numbers.length === 1 ? "Fact" : "Facts"} ${numbers.join(", ")} on this animal's card.`
      : "Read this animal's Fun Facts for a clue.";
  }
  return "Look at this animal's About page for a clue.";
}

// Read-only walk through the submitted answers, styled like the quiz itself.
export function QuizReview() {
  const insets = useSafeAreaInsets();
  const questions = useAbilityQuizStore((state) => state.questions);
  const answers = useAbilityQuizStore((state) => state.answers);
  const result = useAbilityQuizStore((state) => state.result);
  const index = useAbilityQuizStore((state) => state.reviewIndex);
  const question = questions[index];
  const source = result?.review?.find((item) => item.id === question?.id);
  const selected = question ? answers[question.id] : undefined;
  const isLast = index === questions.length - 1;
  const quiz = useAbilityQuizStore.getState;

  return (
    <View style={styles.root}>
      <GameScreenHeader
        title="Review Questions"
        onBack={() => quiz().stopReview()}
      />

      {questions.length > 0 && (
        <QuizStepIndicator total={questions.length} current={index + 1} />
      )}

      <View style={[styles.body, { paddingBottom: 16 + insets.bottom }]}>
        <DetailCard style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>
                  Question {index + 1} of {questions.length}
                </Text>
              </View>
              {question ? (
                <Text style={styles.questionText}>{question.question}</Text>
              ) : null}
              <Text style={styles.note}>
                Your choice is highlighted. Correct answers stay hidden.
              </Text>
            </View>
            {question?.options.map((option, optionIndex) => (
              <QuizOption
                key={optionIndex}
                label={option}
                selected={selected === option}
                onPress={() => {}}
                disabled
              />
            ))}
            <View style={styles.hint}>
              <Text style={styles.hintTitle}>WHERE TO LOOK</Text>
              <Text style={styles.hintText}>{sourceHint(source)}</Text>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <GameButton
              label="Back"
              variant="secondary"
              width="hug"
              style={styles.back}
              disabled={index === 0}
              onPress={() => quiz().previousReviewQuestion()}
            />
            <GameButton
              label={isLast ? "Done" : "Next"}
              width="hug"
              style={styles.next}
              onPress={() =>
                isLast ? quiz().stopReview() : quiz().nextReviewQuestion()
              }
            />
          </View>
        </DetailCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DETAIL_COLORS.background },
  body: { flex: 1, paddingHorizontal: 16 },
  card: { flex: 1, paddingTop: 20, paddingBottom: 18, paddingHorizontal: 18 },
  content: { gap: 12, paddingBottom: 12 },
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
  note: {
    fontFamily: FONTS.bodySemiBold,
    color: DETAIL_COLORS.body,
    fontSize: 13,
  },
  hint: {
    gap: 4,
    marginTop: 4,
    padding: 14,
    backgroundColor: DETAIL_COLORS.mint,
    borderWidth: 2,
    borderColor: DETAIL_COLORS.mintBorder,
    borderRadius: 16,
  },
  hintTitle: { ...fieldLabelStyle, color: DETAIL_COLORS.mintText },
  hintText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: DETAIL_COLORS.mintText,
  },
  footer: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  back: { width: 120 },
  next: { flex: 1 },
});
