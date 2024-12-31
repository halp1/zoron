import { writable } from "svelte/store";

import type { aspen } from "$lib/aspen";

import type { User } from "@auth/sveltekit";

export interface AppState {
  schedule: User["schedule"];
  constants: {
    timeDelta: number;
  };
  preloadedActivity: User["activity"];
  session: {
    cookie: string;
    token: string;
  };
  classes: aspen.Types.Class[];
  activity: Awaited<ReturnType<typeof aspen.activity>>;
}

export const zoron = writable<AppState>(null as any);
