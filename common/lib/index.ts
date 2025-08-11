import chalk from "chalk";

export namespace key {
  export const characters =
    "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM-";
  export const generate = (length: number) =>
    Array.from(
      { length },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join("");
}

export const autoCatch = <T>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

export const autoCatchAsync = async <T>(
  fn: () => Promise<T>
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch {
    return undefined;
  }
};

const _logger = (name: string) => {
  let lastProgress = false;
  const log = (
    level: "info" | "warning" | "error" | "success" | "progress",
    name: string,
    newline: boolean = true,
    ...messages: any[]
  ) => {
    const func =
      level === "info"
        ? chalk.blue
        : level === "warning"
          ? chalk.yellow
          : level === "success"
            ? chalk.greenBright
            : level === "progress"
              ? chalk.magenta
              : chalk.red;
    if (newline) {
      console.log(
        `${lastProgress ? "\n" : ""}${func(`[${name}]`)}`,
        ...messages
      );
      lastProgress = false;
    } else {
      process.stdout.write(
        `${lastProgress ? "\r" : ""}${func(`[${name}]`)} ${messages.map((m) => (typeof m === "string" ? m : JSON.stringify(m))).join(" ")}`
      );
      lastProgress = true;
    }
  };

  return {
    log: (...messages: any[]) => log("info", name, true, ...messages),
    warn: (...messages: any[]) => log("warning", name, true, ...messages),
    error: (...messages: any[]) => log("error", name, true, ...messages),
    success: (...messages: any[]) => log("success", name, true, ...messages),
    info: (...messages: any[]) => log("info", name, true, ...messages),
    progress: (message: string, progress: number) => {
      const fullLength =
        process.stdout.columns - 2 - name.length - 3 - message.length - 1;

      log(
        "progress",
        name,
        false,
        `${message}${process.stdout.columns ? " [" + "=".repeat(Math.round(progress * fullLength)) + " ".repeat(fullLength - Math.round(progress * fullLength)) + "]" : `... ${Math.floor(progress * 100)}%`}`
      );
    }
  };
};

export namespace zoron {
  export const logger = _logger;
  const defaultLogger = _logger("Zoron");
  export const log = defaultLogger.log;
  export const warn = defaultLogger.warn;
  export const error = defaultLogger.error;
  export const success = defaultLogger.success;
  export const info = defaultLogger.info;
  export const progress = defaultLogger.progress;
}
