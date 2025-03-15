if (typeof document !== "undefined" && !("startViewTransition" in document))
  (document as any).startViewTransition = ((func: () => void) => func()) as any;
