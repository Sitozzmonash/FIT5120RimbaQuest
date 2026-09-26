import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
import { FONTS } from "../../../../constants/fonts";
import { Tap } from "../../../common/Tap";
import { ChatBubble } from "./chat/ChatBubble";
import { ChatComposer } from "./chat/ChatComposer";
import { ChatDrawerHeader } from "./chat/ChatDrawerHeader";
import { SuggestionChips } from "./chat/SuggestionChips";

const COMPOSER_BOTTOM_GAP = 12;
const DRAWER_SCREEN_SHARE = 0.95;
const DRAWER_MAX_HEIGHT = 820;
const DEFAULT_SUGGESTIONS = ["What do they eat?", "Where do they live?"];
const EMPTY_QUESTION_MESSAGE = "Please type a question.";
const UNAVAILABLE_MESSAGE =
  "WildGuide cannot chat right now. Please try again soon.";
const REQUEST_ERROR_MESSAGE =
  "I couldn't answer that right now. Please try again.";

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
    `Hi! I'm WildGuide. Ask me anything about the ${species.common_name}.`,
  );
}

function usableSuggestions(suggestions: unknown, fallback: string[]): string[] {
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
  const [keyboardInset, setKeyboardInset] = useState(0);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const inputFocusedRef = useRef(false);
  const [modalLayout, setModalLayout] = useState({
    width: windowWidth,
    height: windowHeight,
    fullHeight: windowHeight,
    measured: false,
  });
  const resizedInset = Math.max(0, modalLayout.fullHeight - modalLayout.height);
  // Android's Modal uses adjustResize. Its measured height already excludes
  // the keyboard, so applying the keyboard event's height would count it twice.
  const composerInset =
    Platform.OS === "android"
      ? resizedInset
      : Math.max(resizedInset, keyboardInset);
  const keyboardOpen = composerInset > 0;
  const drawerHeight = Math.min(
    DRAWER_MAX_HEIGHT,
    modalLayout.fullHeight * DRAWER_SCREEN_SHARE,
  );

  const handleModalLayout = ({
    nativeEvent: { layout },
  }: LayoutChangeEvent) => {
    setModalLayout((previous) => {
      const preserveHeight =
        previous.measured &&
        previous.width === layout.width &&
        (inputFocusedRef.current || Keyboard.isVisible() || keyboardInset > 0);
      return {
        width: layout.width,
        height: layout.height,
        fullHeight: preserveHeight
          ? Math.max(previous.fullHeight, layout.height)
          : layout.height,
        measured: true,
      };
    });
  };

  useEffect(() => {
    if (!visible) {
      setKeyboardInset(0);
      inputFocusedRef.current = false;
    }
  }, [visible]);

  useEffect(() => {
    if (Platform.OS !== "web" || !visible) return;
    const viewport =
      typeof window !== "undefined" ? window.visualViewport : undefined;
    if (!viewport) return;

    const handleResize = () => {
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardInset(inset);
    };

    handleResize();
    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);
    return () => {
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
    };
  }, [visible]);

  useEffect(() => {
    if (Platform.OS === "web" || !visible) return;
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      if (Platform.OS === "ios") Keyboard.scheduleLayoutAnimation(event);
      // Frame-change events also fire when iOS moves the keyboard offscreen.
      setKeyboardInset(
        Math.max(
          0,
          Math.min(
            event.endCoordinates.height,
            Dimensions.get("screen").height - event.endCoordinates.screenY,
          ),
        ),
      );
    });
    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      if (Platform.OS === "ios") Keyboard.scheduleLayoutAnimation(event);
      setKeyboardInset(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

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
  }, [error, isSending, composerInset, messages.length, visible]);

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
        requestError instanceof Error &&
          requestError.message === REQUEST_ERROR_MESSAGE
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
    Keyboard.dismiss();
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
      <View style={styles.modalRoot} onLayout={handleModalLayout}>
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
            {
              top: modalLayout.fullHeight - drawerHeight,
              height: drawerHeight,
              paddingBottom: composerInset,
            },
          ]}
        >
          <ChatDrawerHeader onClose={closeDrawer} />

          {!chatAvailable ? (
            <View style={styles.notice}>
              <MaterialIcons name="info-outline" size={17} color="#5B6B58" />
              <Text style={styles.noticeText}>{UNAVAILABLE_MESSAGE}</Text>
            </View>
          ) : null}

          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            onLayout={() => scrollRef.current?.scrollToEnd({ animated: false })}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                role={message.role}
                citations={message.citations}
              >
                {message.content}
              </ChatBubble>
            ))}

            {isSending ? (
              <ChatBubble role="assistant">
                <View style={styles.thinking}>
                  <ActivityIndicator size="small" color="#3F9A4E" />
                  <Text style={styles.thinkingText}>
                    WildGuide is thinking…
                  </Text>
                </View>
              </ChatBubble>
            ) : null}

            <SuggestionChips
              suggestions={suggestions}
              disabled={!chatAvailable || isSending}
              onPick={(question) => void sendQuestion(question, true)}
            />
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
                  <MaterialIcons name="refresh" size={16} color="#0B3D22" />
                  <Text style={styles.retryText}>Retry</Text>
                </Tap>
              ) : null}
            </View>
          ) : null}

          <ChatComposer
            value={draft}
            speciesName={species.common_name}
            disabled={!chatAvailable || isSending}
            // bottomPadding={
            //   keyboardOpen
            //     ? COMPOSER_BOTTOM_GAP
            //     : insets.bottom + COMPOSER_BOTTOM_GAP
            // }
            bottomPadding={
              COMPOSER_BOTTOM_GAP
            }
            onFocus={() => {
              inputFocusedRef.current = true;
            }}
            onBlur={() => {
              inputFocusedRef.current = false;
            }}
            onChangeText={(value) => {
              setDraft(value);
              if (error) setError(null);
            }}
            onSend={() => void sendQuestion(draft, true)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(8, 22, 14, 0.4)",
  },
  drawer: {
    // Anchor to the unoccluded modal top so resizing cannot lift the header.
    position: "absolute",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: "#FDF2D9",
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: "#073C1D",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    backgroundColor: "#ECE2C8",
    borderWidth: 2,
    borderColor: "#A89D7C",
    borderRadius: 12,
  },
  noticeText: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    color: "#5B6B58",
    fontSize: 12,
    lineHeight: 17,
  },
  messages: { flex: 1 },
  messagesContent: { gap: 12, paddingHorizontal: 16, paddingVertical: 18 },
  thinking: { flexDirection: "row", alignItems: "center", gap: 8 },
  thinkingText: { fontFamily: FONTS.bodyBold, color: "#3F9A4E", fontSize: 13 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FCE8E8",
    borderWidth: 2,
    borderColor: "#073C1D",
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    color: "#B3261E",
    fontSize: 12,
    lineHeight: 17,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  retryText: { fontFamily: FONTS.bodyBlack, color: "#0B3D22", fontSize: 12 },
});
