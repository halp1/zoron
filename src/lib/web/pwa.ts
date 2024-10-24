import { writable } from "svelte/store";

export namespace PWA {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  export const prompt = writable<BeforeInstallPromptEvent | null>(null);

	const showAllowed = () =>
    !window.matchMedia("(display-mode: standalone)").matches &&
    localStorage.getItem("pwa-hide-prompt") !== "1" &&
    window.matchMedia("(max-width: 600px)").matches;

  export const initialize = () => {
    window.addEventListener("beforeinstallprompt", (event) => {
			if (showAllowed()) {
				event.preventDefault();
				prompt.set(event as BeforeInstallPromptEvent);
			}
    });
  };

	export const hidePrompt = () => {
		localStorage.setItem("pwa-hide-prompt", "1");
		prompt.set(null);
	};
}
