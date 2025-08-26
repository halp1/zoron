import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export namespace logger {
  export const LOG_PATH = path.join(process.cwd(), "logs", "logs.log");

  /**
   * Reads a block of log messages from the end of a file using absolute reverse indexing.
   * A "log message" is any chunk of text starting with `[...]` at the beginning of a line,
   * continuing until (but not including) the next such bracketed line.
   *
   * @param filePath           - The path to the file.
   * @param startFromEnd       - Zero-based index from the end (0 = last message, 1 = second-to-last, etc.).
   * @param count              - Number of messages to read (default: 100).
   * @param encoding           - File encoding (default: 'utf8').
   * @returns A Promise that resolves to an array of strings — the selected log messages in chronological order.
   */
  export const reversePaginateFile = async (
    filePath: string,
    startFromEnd: number = 0,
    count: number = 100,
    encoding: BufferEncoding = "utf8"
  ): Promise<string[]> => {
    // 1) Read file
    const content = await fs.readFile(filePath, { encoding });

    // 2) Split into messages
    const raw = content.split(/(?=^\[.*\])/m);
    const messages = raw[0].trim() === "" ? raw.slice(1) : raw;

    const total = messages.length;
    if (startFromEnd >= total) {
      // Asked beyond start of file
      return [];
    }

    // 3) Compute end and start indices in the forward array
    //    endIndex is exclusive in slice(), so it's total - startFromEnd
    const endIndex = total - startFromEnd;
    let startIndex = endIndex - count;
    if (startIndex < 0) {
      startIndex = 0;
    }

    // 4) Slice and return in forward order (oldest first in the block)
    return messages.slice(startIndex, endIndex);
  };

  export class EventEmitter<T extends Record<string, any>> {
    #listeners: [string, (arg: any) => void, boolean][] = [];

    on<K extends keyof T>(event: K, listener: (arg: T[K]) => void) {
      this.#listeners.push([event as string, listener, false]);
    }

    once<K extends keyof T>(event: K, listener: (arg: T[K]) => void) {
      this.#listeners.push([event as string, listener, true]);
    }

    off<K extends keyof T>(event: K, listener: (arg: T[K]) => void) {
      this.#listeners = this.#listeners.filter(
        (l) => l[0] !== event || l[1] !== listener
      );
    }

    emit<K extends keyof T>(event: K, arg: T[K]) {
      for (const [e, listener, once] of this.#listeners) {
        if (e === event) {
          listener(arg);
          if (once) {
            this.off(event, listener);
          }
        }
      }
    }

    removeAllListeners() {
      this.#listeners = [];
    }
  }

  export const events = new EventEmitter<{ log: string }>();

  export const pumpLog = async (message: string) => {
    if (!fsSync.existsSync(LOG_PATH)) {
      await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
      await fs.writeFile(LOG_PATH, "");
    }

    const logStream = fsSync.createWriteStream(LOG_PATH, {
      flags: "a",
      encoding: "utf8",
      mode: 0o644
    });

    logStream.write(`[${new Date().toISOString()}] ${message}\n`);
    logStream.end();

    events.emit("log", `[${new Date().toISOString()}] ${message}`);
  };
}
