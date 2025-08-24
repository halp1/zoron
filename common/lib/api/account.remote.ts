import { query, form, command } from "$app/server";
import { error, redirect } from "@sveltejs/kit";
import * as v from "valibot";
import { adapter, auth, verifyPassword, hashPassword } from "@zoron/common/auth";
import { api } from "@zoron/common/server";
import type { Settings } from "@zoron/common/types";
import _ from "lodash";
import { defaultSettings } from "./account/defaults";
import { getRequestEvent } from "$app/server";
import crypto from "node:crypto";
import { SUPABASE_URI } from "$env/static/private";
import {
  registrationOptions,
  register,
  authenticationOptions,
  authenticate,
} from "@zoron/common/auth/webauthn/server";

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(1)),
  secret: v.pipe(v.string(), v.minLength(1)),
});

const SubscribeSchema = v.object({
  subscription: v.any(),
  device: v.object({
    fingerprint: v.string(),
    browser: v.string(),
    os: v.string(),
    id: v.string(),
    backgroundSync: v.optional(v.boolean()),
  }),
});

const UnsubscribeSchema = v.object({
  id: v.string(),
});

const MarkAsReadSchema = v.array(v.any());

const PasskeyDeleteSchema = v.object({
  passkeyId: v.string(),
});

const PasskeyAuthSchema = v.object({
  sessionID: v.string(),
  response: v.any(),
});

export const login = form(async (data) => {
  const formData = Object.fromEntries(data.entries());
  const result = v.safeParse(LoginSchema, formData);

  if (!result.success) {
    error(400, "Missing email or password");
  }

  const { email, password, secret } = result.output;
  const { cookies } = getRequestEvent();

  const user = await adapter.getUserByEmail!(email);
  if (!user) {
    error(404, "Invalid email.");
  }
  if (!user.password) {
    error(404, "No password set. You can set your password at /account/password");
  }

  const valid = await verifyPassword(password, user.password.salt, user.password.hash);
  if (!valid) {
    error(401, "Invalid password.");
  }

  const session = await adapter.createSession!({
    sessionToken:
      Math.random().toString(36).substring(2) +
      "-" +
      Math.random().toString(36).substring(2),
    userId: user.id,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  });

  const cookieOptions = auth.cookies.sessionToken.options;
  cookies.set(auth.cookies.sessionToken.name, session.sessionToken, {
    domain: cookieOptions.domain,
    path: cookieOptions.path,
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
  });
  cookies.set("secret", secret, {
    path: cookieOptions.path,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    domain: cookieOptions.domain,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    httpOnly: cookieOptions.httpOnly,
  });

  return { user };
});

export const updatePassword = form(async (data) => {
  const { locals, cookies } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user?.email || !session.user.id) {
    error(401, "Not authenticated");
  }

  const password = data.get("password");

  if (!password || typeof password !== "string" || password.length === 0) {
    error(400, "No password provided");
  }
  const { hash, salt } = await hashPassword(password);

  await adapter.updateUser!({
    id: session.user.id,
    password: { hash, salt },
    aspen: undefined,
  } as any);

  const cookieOptions = auth.cookies.sessionToken.options;
  cookies.set("secret", crypto.createHash("sha512").update(password).digest("hex"), {
    path: cookieOptions.path,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    domain: cookieOptions.domain,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    httpOnly: cookieOptions.httpOnly,
  });

  return { success: true };
});

export const updateSettings = form(async (data) => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user?.email) {
    error(401, "Unauthorized");
  }

  // Extract settings from FormData
  const settingsData: any = {};

  // Handle notifications
  if (data.get("notifications.attendance") !== null) {
    settingsData.notifications = {
      ...(settingsData.notifications || {}),
      attendance: data.get("notifications.attendance") === "true",
    };
  }
  if (data.get("notifications.grades") !== null) {
    settingsData.notifications = {
      ...(settingsData.notifications || {}),
      grades: data.get("notifications.grades") === "true",
    };
  }

  // Handle home settings
  if (data.get("home.default")) {
    settingsData.home = {
      ...(settingsData.home || {}),
      default: data.get("home.default"),
    };
  }
  if (data.get("home.hideGPA") !== null) {
    settingsData.home = {
      ...(settingsData.home || {}),
      hideGPA: data.get("home.hideGPA") === "true",
    };
  }

  // Handle social settings
  if (data.get("social.schedule")) {
    settingsData.social = {
      ...(settingsData.social || {}),
      schedule: data.get("social.schedule"),
    };
  }

  const settingsToUpdate: Settings = _.merge(
    defaultSettings,
    session.user.settings || {},
    settingsData
  );

  await adapter.updateUser!({
    id: session.user.id!,
    settings: settingsToUpdate,
  } as any);

  return settingsToUpdate;
});

export const deleteAccount = command(async () => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user) {
    error(401, "Unauthorized");
  }

  try {
    await adapter.deleteUser!(session.user.id!);
    return {};
  } catch {
    error(500, "Failed to delete account");
  }
});

export const subscribe = command(SubscribeSchema, async (body) => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user?.id || !session.user.aspen) {
    error(401, "Session not found");
  }

  const user = await adapter.getUser!(session.user.id);
  if (!user) {
    error(404, "User not found");
  }

  if (
    user.devices &&
    user.devices.some(
      (device: any) =>
        device.device.fingerprint === body.device.fingerprint ||
        device.device.id === body.device.id
    )
  ) {
    await adapter.updateUser!({
      id: session.user.id,
      devices: user.devices.map((device: any) =>
        device.device.fingerprint === body.device.fingerprint ||
        device.device.id === body.device.id
          ? { ...device, subscription: body.subscription }
          : device
      ),
    } as any);
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
            backgroundSync: body.device.backgroundSync || false,
          },
          subscription: body.subscription,
        },
      ],
    } as any);
  }

  return {};
});

export const unsubscribe = command(UnsubscribeSchema, async (body) => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user?.devices) {
    error(400, "No devices to unsubscribe");
  }

  await adapter.updateUser!({
    id: session.user.id!,
    devices: session.user.devices.filter((device: any) => device.device.id !== body.id),
  } as any);

  return {};
});

export const markAsRead = command(MarkAsReadSchema, async (body) => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user?.id || !session.user.aspen) {
    error(401, "Session not found");
  }

  await adapter.updateUser!({
    id: session.user.id,
    seenActivity: [
      ...new Set([
        ...((await adapter.getUser!(session.user.id))?.seenActivity || []),
        ...body,
      ]),
    ],
  } as any);

  return "Marked as read";
});

export const updateProfile = form(async (data) => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user?.id) {
    error(401, "Not authorized");
  }

  const fullName = data.get("fullName");

  if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
    error(400, "Full name must be at least 2 characters");
  }

  try {
    const trimmedName = fullName.trim();

    await adapter.updateUser!({
      id: session.user.id,
      name: trimmedName,
      settings: _.merge(defaultSettings, session.user.settings || {}),
      devices: [],
      activity: undefined,
      schedule: undefined,
    } as any);

    return { name: trimmedName };
  } catch (e: any) {
    error(500, e.message);
  }
});

export const updateProfilePicture = form(async (data) => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user?.id) {
    error(401, "Unauthorized");
  }

  const imageUrl = data.get("imageUrl");

  if (!imageUrl || typeof imageUrl !== "string") {
    error(400, "Invalid image data");
  }

  // Validate that the URL is from Supabase storage
  if (!imageUrl.startsWith(`${SUPABASE_URI}/storage/v1/object/public/`)) {
    error(400, "Invalid image URL: " + imageUrl);
  }

  try {
    await adapter.updateUser!({
      id: session.user.id,
      image: imageUrl,
    } as any);

    return { success: true };
  } catch (e) {
    console.error("Error updating profile picture:", e);
    error(500, "Failed to update profile picture");
  }
});

// Passkey functions
export const getPasskeyRegistrationOptions = query(async () => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  try {
    const data = await registrationOptions(session);
    return data;
  } catch (e) {
    const errorMessage = (e as Error).message;
    error(401, errorMessage);
  }
});

export const verifyPasskeyRegistration = form(async (data) => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  try {
    // Get the registration data - it should be JSON string in the form data
    const registrationData = data.get("registration");
    if (!registrationData || typeof registrationData !== "string") {
      error(400, "Missing registration data");
    }

    const body = JSON.parse(registrationData);
    const result = await register(session, body);
    return result;
  } catch (e) {
    const errorMessage = (e as Error).message;
    error(400, errorMessage);
  }
});

export const deletePasskey = command(PasskeyDeleteSchema, async (body) => {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user?.id) {
    error(401, "Unauthorized");
  }

  const user = await adapter.getUser!(session.user.id);
  if (!user) {
    error(404, "User not found");
  }

  // Cast to any since we know our user has webauthn property
  const userWithWebauthn = user as any;

  // Remove the passkey from the user's passkeys
  const updatedPasskeys =
    userWithWebauthn.webauthn?.passkeys?.filter(
      (passkey: any) => passkey.id !== body.passkeyId
    ) || [];

  // Update the user with the new passkeys array
  await adapter.updateUser!({
    id: session.user.id,
    webauthn: {
      ...userWithWebauthn.webauthn,
      passkeys: updatedPasskeys,
    },
  } as any);

  return { success: true };
});

export const getPasskeyAuthenticationOptions = query(async () => {
  try {
    const data = await authenticationOptions();
    return data;
  } catch (e) {
    const errorMessage = (e as Error).message;
    error(400, errorMessage);
  }
});

export const verifyPasskeyAuthentication = command(PasskeyAuthSchema, async (body) => {
  try {
    const data = await authenticate(body.sessionID, body.response);
    return data;
  } catch (e) {
    const errorMessage = (e as Error).message;
    error(400, errorMessage);
  }
});
