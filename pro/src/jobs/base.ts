export abstract class Job {
  id: string;
  time: number;
  randomness: number;
  timeRanges: [number, number][];

  #timeout: NodeJS.Timeout | null = null;
  constructor({
    id,
    time,
    randomness = 0,
    timeRanges = []
  }: {
    id: string;
    time: number;
    randomness?: number;
    timeRanges?: [number, number][];
  }) {
    this.id = id;
    this.time = time;
    this.randomness = randomness;
    this.timeRanges = timeRanges;
  }

  start() {
    if (this.#timeout) {
      return;
    }

    const runner = () => {
      const msSinceMidnight = Date.now() % (24 * 60 * 60 * 1_000);

      if (
        this.timeRanges.length === 0 ||
        this.timeRanges.some(
          ([start, end]) => msSinceMidnight >= start && msSinceMidnight < end
        )
      ) {
        this.run();
      }

      this.#timeout = setTimeout(
        runner,
        this.time + (Math.random() * 2 - 1) * this.randomness
      );
    };

    runner();
  }

  stop() {
    if (!this.#timeout) {
      return;
    }
    clearTimeout(this.#timeout);
    this.#timeout = null;
  }

  abstract run(): Promise<void> | void;
}
