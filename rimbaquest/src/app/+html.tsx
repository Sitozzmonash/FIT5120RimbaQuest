import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Web-only page shell (not used on iOS/Android).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        {/* Tints the mobile browser's address bar to match the app. */}
        <meta name="theme-color" content="#0E4527" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const pageStyle = `
html, body {
  background-color: #0E4527;
}
html, body, #root {
  height: 100%;
  height: 100dvh;
}
`;
