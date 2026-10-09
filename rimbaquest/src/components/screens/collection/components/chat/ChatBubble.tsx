import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { SpeciesChatCitation } from "../../../../../types";
import { Tap } from "../../../../common/Tap";
import { ChatAvatar } from "./ChatAvatar";
import { CHAT_COLORS } from "./chatTheme";

function citationUrls(citation: SpeciesChatCitation): string[] {
  const candidates = [...(citation.source_urls ?? []), citation.source_url ?? ""];
  return Array.from(
    new Set(
      candidates
        .filter((url) => /^https:\/\//i.test(url.trim()))
        .map((url) => url.trim()),
    ),
  ).slice(0, 4);
}

function displaySourceName(sourceName: string): string {
  // The chat UI already introduces the label with "Source:". Workbook-backed
  // citations used to include "Verified source:" in their name as well, which
  // made the child-facing label unnecessarily repetitive.
  return sourceName.replace(/^verified\s+source\s*:\s*/i, "").trim() || sourceName;
}

function openSource(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}

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
            {citations.map((citation, index) => {
              const sourceUrls = citationUrls(citation);
              return (
                <View
                  key={`${citation.source_id}-${citation.source_url ?? "card"}-${index}`}
                  style={styles.citation}
                >
                  <Text style={styles.citationLabel}>
                    Source: {displaySourceName(citation.source_name)}
                  </Text>
                  {sourceUrls.length ? (
                    <View style={styles.sourceLinks}>
                      {sourceUrls.map((url, sourceIndex) => (
                        <Tap
                          key={url}
                          label={`View source ${sourceIndex + 1}`}
                          style={styles.sourceLink}
                          onPress={() => openSource(url)}
                        >
                          <Text style={styles.sourceLinkText}>
                            {sourceUrls.length === 1
                              ? "View source"
                              : `View source ${sourceIndex + 1}`}
                          </Text>
                        </Tap>
                      ))}
                    </View>
                  ) : null}
                  <Text numberOfLines={2} style={styles.citationExcerpt}>
                    {citation.excerpt}
                  </Text>
                </View>
              );
            })}
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
  sourceLinks: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  sourceLink: {
    alignSelf: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: CHAT_COLORS.green,
    paddingBottom: 1,
  },
  sourceLinkText: {
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
