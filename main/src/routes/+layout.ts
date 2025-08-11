import { storage } from "@zoron/common/web";
import { theme } from "@zoron/common/web/theme";

if (typeof document !== "undefined" && !("startViewTransition" in document))
  (document as any).startViewTransition = ((func: () => void) => func()) as any;

if (typeof document !== "undefined") {
  storage.use("theme", theme);
  theme.subscribe((val) => {
    if (val === "amoled") {
      document.body.classList.remove("bg-gradient", "theme-classic");
      document.body.classList.add("bg-black", "theme-amoled");
    } else {
      document.body.classList.remove("bg-black", "theme-amoled");
      document.body.classList.add("bg-gradient", "theme-classic");
    }
  });
}
