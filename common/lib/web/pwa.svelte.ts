import { writable } from "svelte/store";

import { isIOS, isIOSStandalone } from "./deviceInfo";
import { storage } from "./storage.svelte";

export namespace PWA {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  const storageKey = storage.key("pwa.hide-prompt");

  export const prompt = writable<BeforeInstallPromptEvent | null>(null);
  export const overridePrompt = writable<BeforeInstallPromptEvent | null>(null);
  export const showIOSPopup = writable<boolean>(false);

  const showAllowed = () =>
    !window.matchMedia("(display-mode: standalone)").matches &&
    localStorage.getItem(storageKey) !== "1" &&
    window.matchMedia("(max-width: 600px)").matches;

  export const initialize = () => {
    window.addEventListener("beforeinstallprompt", (event) => {
      if (showAllowed()) {
        event.preventDefault();
        prompt.set(event as BeforeInstallPromptEvent);
      }
      overridePrompt.set(event as BeforeInstallPromptEvent);
    });
    showIOSPopup.set(isIOS() && !isIOSStandalone());
  };

  export const hidePrompt = () => {
    localStorage.setItem(storageKey, "1");
    prompt.set(null);
  };
}
