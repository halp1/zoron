import { query } from '$lib/database';
import type { Item } from '$lib/types';
import { error } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';

export const load = async ({ params: { id } }) => {
	const items = await query<Item>({ collection: 'items', query: { _id: new ObjectId(id) } });
	if (items.length === 0) error(404, 'Invalid subscription id');
	return {
		name: items[0].name
	};
};
