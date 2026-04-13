// This file is symlinked into the subapps.
import type { aspen } from "@zoron/common/aspen";
import type { Passkey } from "@zoron/common/auth/webauthn/types";
import type { Relationship, Settings, Subscription } from "@zoron/common/types";

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
      /** Account age in days */
      accountAge?: number;
      env: {
        vapid: string;
        name: string;
        posthog: {
          key: string;
        };
        commit: string;
        pro: boolean;
      };
      hideFooter: boolean;
      users?: {
        id: string;
        name: string;
        email: string;
        image: string;
      }[];
			notifications: {
				id: string;
				type: "info" | "warning" | "error";
				message: string;
				date: Date;
			}[]
      app?: {
        timeDelta: number;
        schedule: aspen.Types.Schedule.Schedule & { updated: number };
      };
    }
  }
}

declare module "@auth/sveltekit" {
  interface User {
    role?: "user" | "admin";
    devices?: Subscription[];
    aspen?: string;
    session?: { cookie: string; token: string };
    settings?: Settings;
    schedule?: aspen.Types.Schedule.Schedule & { updated: number };
    activity?: ActivityRecord[];
    seenActivity?: string[];
    password?: { hash: string; salt: string };
    webauthn?: {
      passkeys: Passkey[];
      options: PublicKeyCredentialCreationOptionsJSON;
    };
    relationships?: Relationship[];
    pro?: boolean;
    features?: {
      tasks?: boolean;
    };
    tasks?: {
      class: {
        id: string;
        name: string;
      };
      tasks: {
        id: string;
        title: string;
        description: string;
        date: string;
      }[];
    }[];
  }
}

declare module "*.svelte" {
  import { SvelteComponent } from "svelte";
  import { LegacyComponentType } from "svelte/legacy";
  const Comp: LegacyComponentType;
  type Comp = SvelteComponent;
  export default Comp;
}

interface PeriodicSyncManager {
  register(tag: string, options?: PeriodicSyncOptions): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface PeriodicSyncOptions {
  minInterval: number;
  powerState?: boolean;
  networkState?: boolean;
}

interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string;
}

declare var PeriodicSyncManager: {
  prototype: PeriodicSyncManager;
  new (): PeriodicSyncManager;
};

declare global {
  interface ServiceWorkerRegistration {
    readonly periodicSync: PeriodicSyncManager;
  }
}
