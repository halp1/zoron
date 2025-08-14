import { writable } from "svelte/store";

import type { aspen } from "../aspen";

import type { User } from "@auth/sveltekit";

export interface AppState {
  announcements: string[];
  schedule: User["schedule"];
  constants: {
    timeDelta: number;
  };
  preloadedActivity: NonNullable<User["activity"]>;
  session: {
    cookie: string;
    token: string;
  };
  classes: aspen.Types.Class[];
  activity: Awaited<ReturnType<typeof aspen.activity>>;
  transcript: aspen.Types.Transcript;
}

export const zoron = writable<AppState>(null as any);
