export abstract class Job {
  id: string;
  time: number;

  #interval: NodeJS.Timeout | null = null;
  constructor({ id, time }: { id: string; time: number }) {
    this.id = id;
    this.time = time;
  }

  start() {
    if (this.#interval) {
      return;
    }
    this.#interval = setInterval(() => {
      this.run();
    }, this.time);
  }

  stop() {
    if (!this.#interval) {
      return;
    }
    clearInterval(this.#interval);
    this.#interval = null;
  }

  abstract run(): Promise<void> | void;
}
