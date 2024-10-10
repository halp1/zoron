// See https://kit.svelte.dev/docs/types#app

import type { Item, Subscription } from '$lib/types';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			env: {
				vapid: string;
			};
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

declare module "@auth/sveltekit" {
	interface User {
		subscriptions?: string[];
		aspen?: string;
		session?: { cookie: string; token: string };
	}
}