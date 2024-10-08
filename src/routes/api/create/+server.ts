import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { insert } from '$lib/database';
import { key } from '$lib';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session || !session.user || !session.user.email) return error(403, 'Unauthorized');
	const name = (await request.json()).name;
	if (!name || typeof name !== 'string' || name.length === 0) return error(400, 'Missing name');
	const secretKey = key.generate(32);
	try {
		const { insertedId } = await insert('items', {
			owner: session.user.email,
			name: name,
			created: new Date(),
			key: secretKey
		});
		return json({ success: true, id: insertedId, key: secretKey });
	} catch {
		return error(400, 'Invalid subscription');
	}
};
