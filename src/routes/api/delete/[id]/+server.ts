import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '../../delete/[id]/$types';
import { remove, query } from '$lib/database';
import { ObjectId } from 'mongodb';
import type { Subscription, Item } from '$lib/types';

export const DELETE: RequestHandler = async ({ request, locals, params: { id } }) => {
	try {
		const session = await locals.auth();
		if (!session || !session.user || !session.user.email) return error(403, 'Unauthorized');
		const item = await query<Item>({ collection: 'items', query: { _id: new ObjectId(id) } });
		if (!item[0]) return error(404, 'Item not found');
		if (item[0].owner !== session.user.email) return error(403, 'Unauthorized');
		const subscriptions = await query<Subscription>({
			collection: 'subscriptions',
			query: { target: id }
		});
		await Promise.all(
			subscriptions.map(async (sub) => {
				await remove('subscriptions', { _id: sub._id });
			})
		);
		remove('items', { _id: new ObjectId(id) });
		return json({ success: true });
	} catch {
		return error(400, 'Invalid subscription');
	}
};
