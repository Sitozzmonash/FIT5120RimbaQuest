// supporting context for the server's photo authenticity check.
//
// Only four camera fields and a screenshot mark are ever sent. GPS and every
// other EXIF field stay on the device. The server prefers the photo file's own EXIF and uses this
// copy only when the file has none (for example, some iOS gallery exports).

export type PhotoSource = "camera" | "gallery";

export type PhotoMetadata = {
  make?: string;
  model?: string;
  software?: string;
  datetime_original?: string;
  user_comment?: string;
};

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
