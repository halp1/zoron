// See https://kit.svelte.dev/docs/types#app
import type { aspen } from "$lib/aspen";
import type { Passkey } from "$lib/auth/webauthn/types";
import type { Item, Settings, Subscription } from "$lib/types";

import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";

interface ActivityRecord {
  id: string;
  lastLoaded: string;
  data: { scored: number; total: number; percentage: number } | null;
}

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    interface PageData {
      username?: string;
      env: {
        vapid: string;
        name: string;
      };
      hideFooter: boolean;
      schedule?: aspen.Types.Schedule.Schedule & { updated: number };
      constants?: {
        timeDelta: number;
      };
      preloadedActivity?: ActivityRecord[];
      passkeys?: Passkey[];
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};

declare module "@auth/sveltekit" {
  interface User {
    role?: "user" | "admin";
    devices?: Subscription[];
    aspen?: string;
    session?: { cookie: string; token: string };
    settings?: Settings;
    schedule?: aspen.Types.Schedule.Schedule & { updated: number };
    notified?: {
      activity: string[];
    };
    activity?: ActivityRecord[];
    password?: { hash: string; salt: string };
    webauthn?: {
      passkeys: Passkey[];
      options: PublicKeyCredentialCreationOptionsJSON;
    };
  }
}
