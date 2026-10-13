import { Dimensions, PixelRatio } from "react-native";

// supporting context for the server's photo authenticity check.
//
// Only four camera fields, a screenshot mark, a screen-size yes/no and a
// filename category are ever sent (never the filename itself). GPS and every
// other EXIF field stay on the device. The server prefers the photo file's own EXIF and uses this
// copy only when the file has none (for example, some iOS gallery exports).

export type PhotoSource = "camera" | "gallery";

export type PhotoMetadata = {
  make?: string;
  model?: string;
  software?: string;
  datetime_original?: string;
  user_comment?: string;
  // Yes/no only: the photo's pixel size equals this phone's screen.
  screen_sized?: boolean;
  file_origin?: FileOrigin;
};

export type FileOrigin = "screenshot" | "downloaded";

export type PhotoContext = {
  source: PhotoSource;
  metadata: PhotoMetadata;
};

type ExifRecord = Record<string, unknown>;

// Android returns flat tags; iOS nests them under "{TIFF}" and "{Exif}".
function readTag(exif: ExifRecord, group: string, key: string): string | undefined {
  const nested = exif[group];
  const value =
    exif[key] ??
    (nested && typeof nested === "object" ? (nested as ExifRecord)[key] : undefined);
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 80)
    : undefined;
}

// iOS marks screenshots with UserComment "Screenshot". Anything else in that
// field may be personal text, so it is never sent.
function screenshotMark(exif: ExifRecord): string | undefined {
  const comment = readTag(exif, "{Exif}", "UserComment");
  return comment && /screenshot/i.test(comment) ? "Screenshot" : undefined;
}

// Screenshots match the screen's pixel size exactly (either orientation);
// camera photos never do. 2px slack covers density rounding.
export function isScreenSized(width?: number, height?: number): boolean {
  if (!width || !height) return false;
  const screen = Dimensions.get("screen");
  const ratio = PixelRatio.get();
  const screenShort = Math.round(Math.min(screen.width, screen.height) * ratio);
  const screenLong = Math.round(Math.max(screen.width, screen.height) * ratio);
  return (
    Math.abs(Math.min(width, height) - screenShort) <= 2 &&
    Math.abs(Math.max(width, height) - screenLong) <= 2
  );
}

const SCREENSHOT_NAME = /screenshot|screen[ _-]?shot|screen[ _-]?capture|screencap|snip/i;
// Web downloads, chat/social apps, stock sites and AI generators.
const DOWNLOADED_NAME = new RegExp(
  [
    /^download/, /^images?(\s*\(\d+\))?\./, /^unnamed/, // browser "save image"
    /-WA\d+/, /^FB_IMG/, /^received_/, /^Messenger_/, /^photo_\d{4}-\d{2}-\d{2}_/, // WhatsApp, Facebook, Telegram
    /^Snapchat-/, /insta/, /tiktok/, /pinterest/, /^tumblr_/, /^twitter/, /^X_/,
    /shutterstock/, /istock/, /pexels/, /unsplash/, /pixabay/, /adobestock/, /depositphotos/, /dreamstime/, /wallpaper/,
    /chatgpt/, /dall.?e/, /gemini_generated/, /midjourney/, /firefly/,
  ]
    .map((pattern) => pattern.source)
    .join("|"),
  "i",
);

// Android's photo picker hides the real name (it returns an ID like
// "1000111874.jpg"), so this mostly helps on web and iOS.
export function fileOriginFromName(fileName?: string | null): FileOrigin | undefined {
  if (!fileName) return undefined;
  if (SCREENSHOT_NAME.test(fileName)) return "screenshot";
  if (DOWNLOADED_NAME.test(fileName)) return "downloaded";
  return undefined;
}

export function photoContextFromExif(
  source: PhotoSource,
  exif: ExifRecord | null | undefined,
): PhotoContext {
  if (!exif) return { source, metadata: {} };
  return {
    source,
    metadata: {
      make: readTag(exif, "{TIFF}", "Make"),
      model: readTag(exif, "{TIFF}", "Model"),
      software: readTag(exif, "{TIFF}", "Software"),
      datetime_original: readTag(exif, "{Exif}", "DateTimeOriginal"),
      user_comment: screenshotMark(exif),
    },
  };
}
