import type { Settings } from "$lib/types";
import { api } from "$lib/web/api";
import type { RequestHandler } from "./$types";
import {merge} from 'lodash';

export const defaultSettings: Settings = {
	notifications: {
		attendance: false,
		grades: false
	}
}

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
	const session = await auth();
	if (!session?.user?.email) return api.error("Unauthorized", 401);
	const body = await request.json();
	const settingsToUpdate: Settings = merge(defaultSettings, session.user.se);
};
