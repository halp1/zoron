import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import type { aspen } from "./lib/aspen";
import type { Passkey } from "./lib/auth/webauthn/types";
import type { Relationship, Settings, Subscription } from "./lib/types";
import type { SvelteComponent } from "svelte";
import type { LegacyComponentType } from "svelte/legacy";

interface ActivityRecord {
  id: string;
  lastLoaded: string;
  data: { scored: number; total: number; percentage: number } | null;
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
  }
}
declare module '*.svelte' {
	// use prettier-ignore for a while because of https://github.com/sveltejs/language-tools/commit/026111228b5814a9109cc4d779d37fb02955fb8b
	// prettier-ignore
	import { SvelteComponent } from 'svelte'
	import { LegacyComponentType } from 'svelte/legacy';
	const Comp: LegacyComponentType;
	type Comp = SvelteComponent;
	export default Comp;
}
