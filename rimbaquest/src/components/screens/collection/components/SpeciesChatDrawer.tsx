import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Species,
  SpeciesChatCitation,
  SpeciesChatMessage,
  SpeciesChatResponse,
} from "../../../../types";
import { Tap } from "../../../common/Tap";

const DEFAULT_SUGGESTIONS = ["What do they eat?", "Where do they live?"];
const EMPTY_QUESTION_MESSAGE = "Please type a question.";
const UNAVAILABLE_MESSAGE =
  "WildGuide cannot chat right now. Please try again soon.";
const REQUEST_ERROR_MESSAGE =
  "I couldn’t answer that right now. Please try again.";

let messageSequence = 0;

function makeMessage(
  role: SpeciesChatMessage["role"],
  content: string,
  citations?: SpeciesChatCitation[],
): SpeciesChatMessage {
  messageSequence += 1;
  return {
    id: `${role}-${Date.now()}-${messageSequence}`,
    role,
    content,
    citations,
  };
}

function welcomeMessage(species: Species): SpeciesChatMessage {
  return makeMessage(
    "assistant",
    `Hi! I'm WildGuide. Ask me anything about the ${species.common_name}. 🌿`,
  );
}

function usableSuggestions(
  suggestions: unknown,
  fallback: string[],
): string[] {
  if (!Array.isArray(suggestions)) return fallback;

  const cleaned = suggestions
    .filter((question): question is string => typeof question === "string")
    .map((question) => question.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(cleaned)).slice(0, 3);
  return unique.length > 0 ? unique : fallback;
}

export type SpeciesChatDrawerProps = {
  visible: boolean;
  species: Species;
  /** Present only for signed-in children. It is never sent to an AI provider. */
  childId?: number;
  onClose: () => void;
  /** The Expo app talks only to the RimbaQuest backend, never DeepSeek. */
  onSendQuestion?: (question: string) => Promise<SpeciesChatResponse>;
};

export function SpeciesChatDrawer({
  visible,
  species,
  childId,
  onClose,
  onSendQuestion,
}: SpeciesChatDrawerProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const requestVersionRef = useRef(0);
  const defaultSuggestions = useMemo(() => DEFAULT_SUGGESTIONS, []);
  const [messages, setMessages] = useState<SpeciesChatMessage[]>(() => [
    welcomeMessage(species),
  ]);
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);

  const chatAvailable = Boolean(childId && onSendQuestion);

  useEffect(() => {
    // Never show a reply from a previous wildlife card after switching cards.
    requestVersionRef.current += 1;
    setMessages([welcomeMessage(species)]);
    setSuggestions(defaultSuggestions);
    setDraft("");
    setIsSending(false);
    setError(null);
    setFailedQuestion(null);
  }, [defaultSuggestions, species.id]);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      0,
    );
    return () => clearTimeout(timeout);
  }, [error, isSending, messages.length, visible]);

  const sendQuestion = async (question: string, appendUserMessage: boolean) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError(EMPTY_QUESTION_MESSAGE);
      return;
    }
    if (!chatAvailable || !onSendQuestion) {
      setError(UNAVAILABLE_MESSAGE);
      return;
    }
    if (isSending) return;

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    setError(null);
    setFailedQuestion(null);
    setIsSending(true);
    if (appendUserMessage) {
      setMessages((current) => [
        ...current,
        makeMessage("user", trimmedQuestion),
      ]);
      setDraft("");
    }

    try {
      const response = await onSendQuestion(trimmedQuestion);
      const answer = response?.answer?.trim();
      if (!answer) throw new Error("Missing chat answer");
      if (requestVersion !== requestVersionRef.current) return;
      setMessages((current) => [
        ...current,
        makeMessage("assistant", answer, response.citations),
      ]);
      setSuggestions(
        usableSuggestions(response.suggested_questions, defaultSuggestions),
      );
    } catch (requestError) {
      if (requestVersion !== requestVersionRef.current) return;
      setError(
        requestError instanceof Error && requestError.message === REQUEST_ERROR_MESSAGE
          ? requestError.message
          : REQUEST_ERROR_MESSAGE,
      );
      setFailedQuestion(trimmedQuestion);
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setIsSending(false);
      }
    }
  };

  const closeDrawer = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closeDrawer}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Tap
          label="Close WildGuide chat"
          style={StyleSheet.absoluteFill}
          onPress={closeDrawer}
        >
          <View />
        </Tap>

        <View
          style={[
            styles.drawer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <MaterialIcons name="auto-awesome" size={17} color="#28734A" />
            </View>
            <Text style={styles.statusText}>We are ready to help you!</Text>
            <Tap
              label="Close WildGuide chat"
              style={styles.closeButton}
              onPress={closeDrawer}
            >
              <MaterialIcons name="close" size={19} color="#526258" />
            </Tap>
          </View>

          {!chatAvailable ? (
            <View style={styles.unavailableNotice}>
              <MaterialIcons name="info-outline" size={17} color="#5D6B62" />
              <Text style={styles.unavailableText}>{UNAVAILABLE_MESSAGE}</Text>
            </View>
          ) : null}

          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.role === "assistant"
                    ? styles.assistantBubble
                    : styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === "user" && styles.userMessageText,
                  ]}
                >
                  {message.content}
                </Text>
                {message.role === "assistant" && message.citations?.length ? (
                  <View style={styles.citationsBlock}>
                    {message.citations.map((citation, index) => (
                      <View
                        key={`${message.id}-${citation.source_id}-${citation.source_url ?? "card"}-${index}`}
                        style={styles.citationItem}
                      >
                        <Text style={styles.citationLabel}>
                          Source: {citation.source_name}
                        </Text>
                        <Text numberOfLines={2} style={styles.citationExcerpt}>
                          {citation.excerpt}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}

            {isSending ? (
              <View
                style={[
                  styles.messageBubble,
                  styles.assistantBubble,
                  styles.loadingBubble,
                ]}
              >
                <ActivityIndicator size="small" color="#28734A" />
                <Text style={styles.loadingText}>WildGuide is thinking…</Text>
              </View>
            ) : null}

            <View style={styles.suggestionsBlock}>
              <Text style={styles.suggestionsLabel}>Try asking</Text>
              <View style={styles.suggestionRow}>
                {suggestions.map((suggestion) => (
                  <Tap
                    key={suggestion}
                    label={`Ask: ${suggestion}`}
                    style={[
                      styles.suggestionChip,
                      (!chatAvailable || isSending) &&
                        styles.suggestionChipDisabled,
                    ]}
                    disabled={!chatAvailable || isSending}
                    onPress={() => void sendQuestion(suggestion, true)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Tap>
                ))}
              </View>
            </View>
          </ScrollView>

          {error ? (
            <View style={styles.errorRow}>
              <Text style={styles.errorText}>{error}</Text>
              {failedQuestion && chatAvailable ? (
                <Tap
                  label="Retry last question"
                  style={styles.retryButton}
                  onPress={() => void sendQuestion(failedQuestion, false)}
                >
                  <MaterialIcons name="refresh" size={16} color="#0A4D26" />
                  <Text style={styles.retryText}>Retry</Text>
                </Tap>
              ) : null}
            </View>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              accessibilityLabel={`Ask a question about ${species.common_name}`}
              style={styles.composerInput}
              value={draft}
              onChangeText={(value) => {
                setDraft(value);
                if (error) setError(null);
              }}
              placeholder="Ask about this animal..."
              placeholderTextColor="#92A099"
              editable={chatAvailable && !isSending}
              returnKeyType="send"
              onSubmitEditing={() => void sendQuestion(draft, true)}
              maxLength={300}
            />
            <Tap
              label="Send question"
              style={[
                styles.sendButton,
                (!chatAvailable || isSending) && styles.sendButtonDisabled,
              ]}
              disabled={!chatAvailable || isSending}
              onPress={() => void sendQuestion(draft, true)}
            >
              <MaterialIcons name="send" size={19} color="#FFFFFF" />
            </Tap>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(20, 32, 24, 0.52)",
  },
  drawer: {
    width: "100%",
    maxWidth: 520,
    height: "76%",
    maxHeight: 720,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#001A0A",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 16,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "#D8E3DA",
    marginTop: 10,
    marginBottom: 7,
  },
  statusRow: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2EE",
  },
  statusIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F5EA",
  },
  statusText: { flex: 1, color: "#253128", fontSize: 14, fontWeight: "800" },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F5F2",
  },
  unavailableNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#F1F4F2",
  },
  unavailableText: { flex: 1, color: "#5D6B62", fontSize: 12, lineHeight: 17 },
  messages: { flex: 1 },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 10,
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E7F5EA",
    borderTopLeftRadius: 5,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#075A2B",
    borderTopRightRadius: 5,
  },
  messageText: {
    color: "#253128",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  userMessageText: { color: "#FFFFFF" },
  citationsBlock: {
    marginTop: 9,
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: "#C9E3CF",
    paddingTop: 8,
  },
  citationItem: { gap: 2 },
  citationLabel: { color: "#286341", fontSize: 10, fontWeight: "900" },
  citationExcerpt: { color: "#526258", fontSize: 10, lineHeight: 14 },
  loadingBubble: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingText: { color: "#28734A", fontSize: 13, fontWeight: "700" },
  suggestionsBlock: { marginTop: 3, gap: 7 },
  suggestionsLabel: { color: "#758178", fontSize: 11, fontWeight: "800" },
  suggestionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: {
    borderWidth: 1,
    borderColor: "#C5E5CE",
    borderRadius: 16,
    backgroundColor: "#F8FFFA",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  suggestionChipDisabled: { opacity: 0.5 },
  suggestionText: { color: "#28734A", fontSize: 11, fontWeight: "800" },
  errorRow: {
    minHeight: 42,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF2F1",
    borderWidth: 1,
    borderColor: "#FFD1CC",
  },
  errorText: {
    flex: 1,
    color: "#9C3024",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  retryText: { color: "#0A4D26", fontSize: 12, fontWeight: "900" },
  composer: {
    minHeight: 58,
    marginHorizontal: 16,
    paddingLeft: 13,
    paddingRight: 5,
    borderRadius: 24,
    backgroundColor: "#F1F5F2",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 46,
    color: "#253128",
    fontSize: 14,
    paddingVertical: 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#075A2B",
  },
  sendButtonDisabled: { opacity: 0.45 },
});
