import type { Job } from "./base";
import { Notifier } from "./notifier";

export namespace jobs {
  export const jobs: InstanceType<typeof Job>[] = [];
  export const init = () => {
    jobs.splice(0, jobs.length, new Notifier());

    for (const job of jobs) {
      job.start();
    }
  };

  export const stop = () => {
    for (const job of jobs) {
      job.stop();
    }
    jobs.splice(0, jobs.length);
  };
}
