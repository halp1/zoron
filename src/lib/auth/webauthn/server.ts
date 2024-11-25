import { adapter } from "$lib/auth";

import type { Session, User } from "@auth/sveltekit";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from "@simplewebauthn/types";

import type { Passkey, UserModel } from "./types";
import { query, transformID, insert } from "$lib/database";
import { ObjectId } from "mongodb";

const rp = {
  name: "SimpleWebAuthn Example",
  id: "simplewebauthn.dev",
  origin: `https://simplewebauthn.dev`
};

// Note: Create this index in MongoDB UI using:
// db.challenges.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 })
// The expireAfterSeconds: 0 means "remove as soon as the expires timestamp is reached"
// The actual 5-minute expiration comes from the expires field we set in addChallenge

const getUserPasskeys = async (uid: string) => {
  const dbUser = (await adapter.getUser!(uid)) as unknown as User;
  return (dbUser?.webauthn?.passkeys ?? []) as Passkey[];
};

export const getCurrentRegistrationOptions = async (
  userId: string
): Promise<PublicKeyCredentialCreationOptionsJSON> => {
  const dbUser = (await adapter.getUser!(userId)) as unknown as User;
  if (!dbUser?.webauthn?.options) {
    throw new Error("No registration options found for user");
  }
  return dbUser.webauthn.options;
};

export const registrationOptions = async (session: Session | null) => {
  if (!session?.user?.id || !session.user.email) throw new Error("User not found");

  const user: UserModel = {
    id: session.user.id,
    username: session.user?.email
  };

  const userPasskeys: Passkey[] = await getUserPasskeys(user.id);

  const options = await generateRegistrationOptions({
    rpName: rp.name,
    rpID: rp.id,
    userName: user.username,
    attestationType: "none",
    excludeCredentials: userPasskeys.map((passkey) => ({
      id: passkey.id,
      transports: passkey.transports
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred"
    }
  });

  // Store options in user's webauthn data
  await adapter.updateUser!({
    id: user.id,
    webauthn: {
      passkeys: userPasskeys,
      options
    }
  } as any);

  return options;
};

export const register = async (session: Session | null, body: any) => {
  if (!session?.user?.id) throw new Error("User not found");

  const currentOptions = await getCurrentRegistrationOptions(session.user.id);
  const userPasskeys = await getUserPasskeys(session.user.id);

  const verification = await verifyRegistrationResponse({
    response: body,
    requireUserVerification: false,
    expectedChallenge: currentOptions.challenge,
    expectedOrigin: rp.origin,
    expectedRPID: rp.id
  });

  if (!verification.verified) {
    throw new Error("Verification failed");
  }

  const { registrationInfo } = verification;
  if (!registrationInfo) {
    throw new Error("Missing registration info");
  }

  const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;

  const user: UserModel = {
    id: session.user.id,
    username: session.user.email!
  };

  // Create new passkey entry
  const newPasskey: Passkey = {
    user,
    webauthnUserID: currentOptions.user.id,
    id: credential.id,
    publicKey: credential.publicKey,
    counter: credential.counter,
    transports: credential.transports,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp
  };

  // Add the new passkey to the user's existing passkeys
  const updatedPasskeys = [...userPasskeys, newPasskey];

  // Clear options after successful verification and store the new passkey
  await adapter.updateUser!({
    id: session.user.id,
    webauthn: {
      passkeys: updatedPasskeys,
      options: null
    }
  } as any);

  return verification;
};

export const addChallenge = async (challenge: string) => {
  const randomSessionID = Math.random().toString(36).slice(2);
  
  // Set expiration to 5 minutes from now
  // MongoDB will remove the document when this timestamp is reached
  // due to the TTL index created with expireAfterSeconds: 0
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 5);

  await insert("challenges", {
    session: randomSessionID,
    challenge,
    expires
  });

  return randomSessionID;
};

export const authenticationOptions = async () => {
  const options = await generateAuthenticationOptions({
    rpID: rp.id,
    userVerification: "preferred",
    allowCredentials: []
  });


	return options;
};

export const authenticate = async (sessionID: string, body: any) => {
}
