import * as ImagePicker from "expo-image-picker";
import { PhotoContext, PhotoSource, photoContextFromExif } from "./photoContext";

export type SystemCameraPhoto = {
  uri: string;
  mimeType: string;
  context: PhotoContext;
};

// A browser camera preview is a low-resolution video frame with weak
// autofocus and no lens switching, which blurs close-ups and hides the screen
// moire the recapture check needs. On web, hand off to the phone's own camera
// app instead so the server gets the full-resolution photo with its EXIF.
//
// Browsers only open the camera from a tap, so call this before any other
// await in the press handler. Resolves null when the user cancels.
export async function takeSystemCameraPhoto(): Promise<SystemCameraPhoto | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    cameraType: ImagePicker.CameraType.back,
    allowsEditing: false,
    quality: 1,
    exif: true,
  });
  return toPhoto(result, "camera");
}

// Same contract as takeSystemCameraPhoto, for an existing photo.
export async function pickGalleryPhoto(): Promise<SystemCameraPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    exif: true,
  });
  return toPhoto(result, "gallery");
}

function toPhoto(
  result: ImagePicker.ImagePickerResult,
  source: PhotoSource,
): SystemCameraPhoto | null {
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset?.uri) return null;
  return {
    uri: asset.uri,
    mimeType: asset.mimeType || "image/jpeg",
    context: photoContextFromExif(source, asset.exif),
  };
}
