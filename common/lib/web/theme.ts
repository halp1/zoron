import { writable } from "svelte/store";
import { storage } from "./storage.svelte";

export const theme = writable<"zoron" | "amoled">("amoled");
export const mode = writable<"light" | "dark">("dark");

export const initTheme = () => {
  if (typeof document !== "undefined" && !("startViewTransition" in document))
    (document as any).startViewTransition = ((func: () => void) => func()) as any;

  if (typeof document !== "undefined") {
    storage.use("theme.style", theme);
    theme.subscribe((val) => {
      if (val === "amoled") {
        document.body.classList.remove("bg-gradient", "theme-classic");
        document.body.classList.add("bg-black", "theme-amoled");
      } else {
        document.body.classList.remove("bg-black", "theme-amoled");
        document.body.classList.add("bg-gradient", "theme-classic");
        mode.set("dark");
      }
    });

    storage.use("theme.mode", mode);
    mode.subscribe((val) => {
      if (val === "light") {
        document.querySelector("html")!.classList.add("light");
      } else {
        document.querySelector("html")!.classList.remove("light");
      }
    });
  }
};
