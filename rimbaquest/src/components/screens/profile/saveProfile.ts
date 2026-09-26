import { API_BASE } from "../../../constants/config";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { useProfileEditStore } from "../../../store/useProfileEditStore";
import { useUserStore } from "../../../store/useUserStore";
import { apiMessage } from "../../../utils/authApi";

// Validates and saves the profile being edited, then returns to the profile.
export async function saveProfile() {
  const store = useProfileEditStore.getState();
  const username = store.displayName.trim() || store.originalUsername;
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    store.setError(
      "Use 3 to 20 letters or numbers. You can also use - or _ with no spaces.",
    );
    return;
  }
  store.setError(null);
  store.setSaving(true);
  try {
    const user = useUserStore.getState();
    const res = await fetch(
      `${API_BASE}/api/v1/children/${user.currentUser.id}/profile`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...user.authHeaders(),
        },
        body: JSON.stringify({
          username,
          avatar: store.avatar,
          age: parseInt(store.age, 10),
        }),
      },
    );
    if (res.status === 401 || res.status === 403) {
      await user.expire();
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = apiMessage(
        data,
        "We could not save your profile changes.",
      );
      store.setError(
        /username.*taken/i.test(message)
          ? "Someone already uses that explorer name. Try another one."
          : "We could not save your changes. Please try again.",
      );
      return;
    }
    useUserStore.getState().applyProfileUpdate(data, username);
    useNavigationStore.getState().goBack();
  } catch {
    store.setError("We couldn't save your changes. Please try again.");
  } finally {
    store.setSaving(false);
  }
}
