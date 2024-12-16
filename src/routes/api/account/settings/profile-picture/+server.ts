import { adapter } from "$lib/auth";
import { api } from "$lib/server";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals: { auth } }) => {
    const session = await auth();
    if (!session?.user?.id) return api.error("Unauthorized", 401);

    const { imageUrl } = await request.json();
    
    // Validate that the URL is from Supabase storage
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    if (!imageUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/`)) {
        return api.error("Invalid image URL", 400);
    }

    try {
        await adapter.updateUser!({
            id: session.user.id,
            image: imageUrl
        } as any);

        return api.json({ success: true });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        return api.error("Failed to update profile picture", 500);
    }
};
