import { ObjectId } from './../../node_modules/bson/src/objectid';
import { transformID } from './../lib/database/index';
import { VAPID_PUBLIC } from '$env/static/private';
import { query } from '$lib/database';
import type { Item, Subscription } from '$lib/types';
export const load = async (event) => {
	const auth = await event.locals.auth();
	const account =
		auth && auth.user && auth.user.email
			? {
					items: (
						await query<Item>({ collection: 'items', query: { owner: auth.user.email } })
					).map((item) => transformID(item)),
					subscriptions: await Promise.all(
						(
							await query<Subscription>({
								collection: 'subscriptions',
								query: { email: auth.user.email }
							})
						)
							.map((item) => transformID(item))
							.map(async (sub) => ({
								...sub,
								item: (
									await query<Item>({
										collection: 'items',
										query: { _id: new ObjectId(sub.target) },
										projection: { name: 1, _id: 0 }
									})
								)[0]?.name
							}))
					)
				}
			: {};
	return {
		session: await event.locals.auth(),
		env: {
			vapid: VAPID_PUBLIC
		},
		account
	};
};
