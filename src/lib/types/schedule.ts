import type { aspen } from "$lib/aspen";

export type Block =
  | ({
      type: "block";
      color: string;
    } & aspen.Types.Schedule.Course)
  | {
      type: "free";
      color: string;
    }
  | { type: "I-block"; color: string }
  | { type: "lunch"; color: string };