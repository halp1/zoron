import { api } from "$lib/web/api";
import { error, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({locals: {auth}, request}) => {
  const session = await auth();
  if (!session || !session.user) api.error('Not authorized', 401);
  const data: {username: string, password: string} = await request.json();
  if (!data.username || typeof data.username !== 'string' || data.username.length === 0) 
    api.error('Missing username', 400);
  if (!data.password || typeof data.password !== 'string' || data.password.length === 0)
    api.error('Missing password', 400);
  
  try {
    const account = 
  }
}