import { Preferences } from "@capacitor/preferences";

/* Backs Supabase's session persistence with Capacitor's Preferences plugin
   instead of handing the browser Storage API straight to the client. On
   native iOS this writes to the device's own UserDefaults store, outside
   the WebView's storage sandbox — the layer the OS can clear under rare
   low-storage conditions, unlike the app's own on-device storage. On the
   web build, Preferences' own web implementation just proxies to
   localStorage, so the PWA's behavior is unchanged. */
export const capacitorAuthStorage = {
  async getItem(key) {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  },
  async setItem(key, value) {
    await Preferences.set({ key, value });
  },
  async removeItem(key) {
    await Preferences.remove({ key });
  },
};
