import { UserProfile } from "../types";
import { DEFAULT_AVATAR } from "../constants/images";

export function apiMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (
      Array.isArray(detail) &&
      detail[0] &&
      typeof detail[0] === "object" &&
      detail[0] &&
      "msg" in detail[0]
    ) {
      return String((detail[0] as { msg: string }).msg);
    }
  }
  return fallback;
}

export function profileFromAuth(data: Record<string, unknown>): UserProfile {
  return {
    id: Number(data.child_id || data.id || 0),
    username: String(data.username || ""),
    email: String(data.email || ""),
    display_name: String(data.display_name || data.username || "Explorer"),
    avatar: String(data.avatar || DEFAULT_AVATAR),
    age: Number(data.age || 10),
    age_band: "8-11",
    xp: Number(data.xp || 0),
    level: Number(data.level || 1),
  };
}
