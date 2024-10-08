import { VAPID_PUBLIC } from '$env/static/private';
import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async (event) => {
	const auth = await event.locals.auth();
	
	return {
		session: auth,
		env: {
			vapid: VAPID_PUBLIC
		},
	};
};
