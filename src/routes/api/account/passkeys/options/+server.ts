import { registrationOptions } from "$lib/auth/webauthn/server";
import { api } from "$lib/server";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({locals: {auth}}) => {
	const session = await auth();
	try {
		const data = await registrationOptions(session);
		return api.json(data);
	} catch (e){
		const error = (e as Error).message;
		return api.error(error, 401);
	}
}