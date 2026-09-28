import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../../constants/fonts";
import { useDiscoveryStore } from "../../../../store/useDiscoveryStore";
import { DiscoveryHeader } from "./DiscoveryHeader";
import { PeekToggle } from "./PeekToggle";
import { PhotoBackdrop } from "./PhotoBackdrop";
import { QuestionBlock } from "./QuestionBlock";

export function PickStepLayout({
  question,
  message,
  headerDisabled = false,
  footer,
  children,
}: {
  question: React.ReactNode;
  message?: string | null;
  headerDisabled?: boolean;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [peeking, setPeeking] = useState(false);

  return (
    <View style={styles.page}>
      <PhotoBackdrop />
      <DiscoveryHeader
        title="RimbaQuest"
        confirmDiscard
        disabled={headerDisabled}
        onDiscard={() => useDiscoveryStore.getState().discardAndExit()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!peeking}
      >
        <View style={[styles.choices, peeking && styles.hidden]}>
          <QuestionBlock>{question}</QuestionBlock>
          {children}
        </View>
        <PeekToggle
          peeking={peeking}
          onToggle={() => setPeeking((value) => !value)}
        />
        {message ? (
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0F0B" },
  content: {
    flexGrow: 1,
    gap: 16,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  choices: { gap: 16, alignItems: "center" },
  // Keeps the space so the eye button doesn't jump while peeking.
  hidden: { opacity: 0, pointerEvents: "none" },
  message: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FCE8E8",
    borderRadius: 12,
    overflow: "hidden",
    fontFamily: FONTS.bodyBold,
    color: "#B3261E",
    fontSize: 13,
    textAlign: "center",
  },
  footer: { paddingTop: 8, paddingHorizontal: 24 },
});
