import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { SpeciesChatCitation } from "../../../../../types";
import { ChatAvatar } from "./ChatAvatar";
import { CHAT_COLORS } from "./chatTheme";

export function ChatBubble({
  role,
  children,
  citations,
}: {
  role: "assistant" | "user";
  children: React.ReactNode;
  citations?: SpeciesChatCitation[];
}) {
  if (role === "user") {
    return (
      <View style={[styles.bubble, styles.user]}>
        <Text style={[styles.text, styles.userText]}>{children}</Text>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <ChatAvatar />
      <View style={[styles.bubble, styles.assistant]}>
        {typeof children === "string" ? (
          <Text style={styles.text}>{children}</Text>
        ) : (
          children
        )}
        {citations?.length ? (
          <View style={styles.citations}>
            {citations.map((citation, index) => (
              <View
                key={`${citation.source_id}-${citation.source_url ?? "card"}-${index}`}
                style={styles.citation}
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
    </View>
  );
}

const styles = StyleSheet.create({
  assistantRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: CHAT_COLORS.ink,
    borderRadius: 16,
  },
  assistant: {
    flexShrink: 1,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: CHAT_COLORS.green,
    borderBottomRightRadius: 4,
  },
  text: {
    fontFamily: FONTS.bodyBold,
    color: CHAT_COLORS.heading,
    fontSize: 14,
    lineHeight: 19.6,
  },
  userText: { fontFamily: FONTS.bodyExtraBold, color: "#FFFFFF" },
  citations: {
    marginTop: 8,
    paddingTop: 8,
    gap: 6,
    borderTopWidth: 2,
    borderTopColor: CHAT_COLORS.sand,
  },
  citation: { gap: 2 },
  citationLabel: {
    fontFamily: FONTS.bodyBlack,
    color: CHAT_COLORS.green,
    fontSize: 10,
  },
  citationExcerpt: {
    fontFamily: FONTS.bodyBold,
    color: "#5B6B58",
    fontSize: 10,
    lineHeight: 14,
  },
});
