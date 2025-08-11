import { adapter } from "@zoron/common/auth";
import { api } from "@zoron/common/server";

export const POST = async ({ locals: { auth }, request }) => {
  const session = await auth();

  if (!session?.user?.devices)
    throw api.error("No devices to unsubscribe", 400);

  const body = await request.json();

  const id = body.id;
  if (!id) throw api.error("No device ID provided", 400);

  await adapter.updateUser!({
    id: session.user.id!,
    devices: session.user.devices.filter((device) => device.device.id !== id)
  });

  return api.json();
};
