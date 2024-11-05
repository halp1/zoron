// See https://kit.svelte.dev/docs/types#app
import type { aspen } from "$lib/aspen";
import type { Item, Settings, Subscription } from "$lib/types";

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    interface PageData {
      username?: string;
      env: {
        vapid: string;
      };
      hideFooter: boolean;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};

declare module "@auth/sveltekit" {
  interface User {
    devices?: Subscription[];
    aspen?: string;
    session?: { cookie: string; token: string };
    settings?: Settings;
    schedule?: aspen.Types.Schedule.Schedule & { updated: number };
    notified?: {
      activity: string[];
    };
    activity?: { id: string; data: { scored: number; total: number; percentage: number } | null }[];
    password?: { hash: string; salt: string };
  }
}
