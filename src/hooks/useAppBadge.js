import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { requestNotificationPermission, setBadgeCountForNotifications } from "./useNotifications";

const isNative = Capacitor.isNativePlatform();

/* Keeps the OS app-icon badge (applicationIconBadgeNumber) in sync with the
   Inbox's unread count — a browser tab can't touch this, only a native
   plugin can. Also mirrors the count into useNotifications so any local
   notification scheduled afterward carries the right badge number, which is
   the only way the number is still right once the app has been closed. */
export function useAppBadge(count) {
  useEffect(() => {
    setBadgeCountForNotifications(count);
    if (!isNative) return;
    (async () => {
      await requestNotificationPermission();
      const { Badge } = await import("@capawesome/capacitor-badge");
      if (count > 0) await Badge.set({ count });
      else await Badge.clear();
    })().catch(console.error);
  }, [count]);
}
