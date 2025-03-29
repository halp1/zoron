import { Job } from "./base";

export class Notifier extends Job {
  constructor() {
    super({ id: "notifier", time: 1000 });
  }

  async run() {
		console.log('test 1');
  }
}
