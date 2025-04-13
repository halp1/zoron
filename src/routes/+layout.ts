import { storage } from "$lib/web";
import { theme } from "$lib/web/theme";

if (typeof document !== "undefined" && !("startViewTransition" in document))
  (document as any).startViewTransition = ((func: () => void) => func()) as any;

if (typeof document !== "undefined") {
  storage.use("theme", theme);
  theme.subscribe((val) => {
    if (val === "amoled") {
      document.body.classList.remove("bg-gradient");
      document.body.classList.add("bg-black");
    } else {
      document.body.classList.remove("bg-black");
      document.body.classList.add("bg-gradient");
    }
  });
}
