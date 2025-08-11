import { adapter } from "@zoron/common/auth";
import { api } from "@zoron/common/server";

export const POST = async ({ request, locals: { auth } }) => {
  const session = await auth();

  if (!session?.user?.id || !session.user.aspen)
    throw api.error("Session not found", 401);

  const body = await request.json();

  if (!body.subscription) throw api.error("Missing subscription", 400);
  if (
    !body.device ||
    !body.device.fingerprint ||
    !body.device.browser ||
    !body.device.os ||
    !body.device.id
  )
    throw api.error("Bad device data", 400);

  const user = await adapter.getUser!(session.user.id);

  if (!user) throw api.error("User not found", 404);

  if (
    user.devices &&
    user.devices.some(
      (device) =>
        device.device.fingerprint === body.device.fingerprint ||
        device.device.id === body.device.id
    )
  ) {
    await adapter.updateUser!({
      id: session.user.id,
      devices: user.devices.map((device) =>
        device.device.fingerprint === body.device.fingerprint ||
        device.device.id === body.device.id
          ? { ...device, subscription: body.subscription }
          : device
      )
    });
  } else {
    await adapter.updateUser!({
      id: session.user.id,
      devices: [
        ...(user.devices || []),
        {
          created: new Date(),
          device: {
            fingerprint: body.device.fingerprint,
            id: body.device.id,
            browser: body.device.browser,
            os: body.device.os,
            backgroundSync: body.device.backgroundSync || false
          },
          subscription: body.subscription
        }
      ]
    });
  }

  return api.json({});
};
