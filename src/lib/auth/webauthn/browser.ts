import { requests } from "$lib/web";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type { VerifiedRegistrationResponse } from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON
} from "@simplewebauthn/types";

/**
 * Adds a new passkey for the current user
 * @param name The user-friendly name for the passkey
 * @returns true if the passkey was successfully added
 */
export async function addPasskey(name: string): Promise<boolean> {
  try {
    // Get registration options from server
    const optionsRes = await requests.get<PublicKeyCredentialCreationOptionsJSON>(
      "/api/account/passkeys/options"
    );
    if (!optionsRes.success) {
      throw new Error("Failed to get registration options: " + optionsRes.error);
    }

    // Create credential using SimpleWebAuthn
    const responseData = await startRegistration({
      optionsJSON: optionsRes.data
    });

    // Send response to server for verification
    const verifyRes = await requests.post<VerifiedRegistrationResponse>(
      "/api/account/passkeys/verify",
      { ...responseData, name }
    );

    if (!verifyRes.success) {
      throw new Error("Failed to verify registration:" + verifyRes.error);
    }

    return verifyRes.data.verified;
  } catch (error) {
    console.error("Error adding passkey:", error);
    throw error;
  }
}

/**
 * Uses an existing passkey to authenticate
 * @returns The authenticated user ID if successful
 */
export const usePasskey = async (): Promise<string> => {
  try {
    // Get authentication options from server
    const optionsRes = await requests.get<{
      sessionID: string;
      options: PublicKeyCredentialRequestOptionsJSON;
    }>("/api/account/passkeys/auth/options");
    if (!optionsRes.success) {
      throw new Error("Failed to get authentication options: " + optionsRes.error);
    }
    const { sessionID, options } = optionsRes.data;

    // Get credential using SimpleWebAuthn
    const responseData = await startAuthentication({
      optionsJSON: options
    });

    // Send response to server for verification
    const verifyRes = await requests.post<{ verified: true; user: string }>(
      "/api/account/passkeys/auth/verify",
      {
        sessionID,
        response: responseData
      }
    );

    if (!verifyRes.success) {
      throw new Error("Failed to verify authentication:" + verifyRes.error);
    }

    const { verified, user } = verifyRes.data;
    if (!verified) {
      throw new Error("Authentication failed");
    }

    return user;
  } catch (error) {
    console.error("Error using passkey:", error);
    throw error;
  }
};
