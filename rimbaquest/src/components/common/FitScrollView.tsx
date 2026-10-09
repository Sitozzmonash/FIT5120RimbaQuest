import React, { useState } from "react";
import { ScrollView, ScrollViewProps } from "react-native";

// A screen body designed to fit without scrolling. Scrolling only switches on
// when the device is too short for the content, so nothing gets cut off.
export function FitScrollView({ children, ...props }: ScrollViewProps) {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const overflows = viewportHeight > 0 && contentHeight > viewportHeight + 1;

  return (
    <ScrollView
      {...props}
      scrollEnabled={overflows}
      bounces={false}
      showsVerticalScrollIndicator={overflows}
      onLayout={(e) => {
        setViewportHeight(e.nativeEvent.layout.height);
        props.onLayout?.(e);
      }}
      onContentSizeChange={(width, height) => {
        setContentHeight(height);
        props.onContentSizeChange?.(width, height);
      }}
    >
      {children}
    </ScrollView>
  );
}
