import { register } from "$lib/auth/webauthn/server";
import { api } from "$lib/server";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({locals: {auth}, request}) => {
	const session = await auth();
	try {
		const data = await register(session, await request.json());
		return api.json(data);
	} catch (e){
		const error = (e as Error).message;
		return api.error(error, 400);
	}
}
