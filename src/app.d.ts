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
			name?: string;
			account: {
				subscriptions: (Subscription & { _id: string, item: string })[];
				items: (Item & { _id: string })[];
			};
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
