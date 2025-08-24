import { account } from "../../api";
import { requests } from "../../web";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type { VerifiedRegistrationResponse } from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";

/**
 * Adds a new passkey for the current user
 * @param name The user-friendly name for the passkey
 * @returns true if the passkey was successfully added
 */
export async function addPasskey(name: string): Promise<boolean> {
  try {
    // Get registration options from server
    const optionsData = await account.getPasskeyRegistrationOptions();

    // Create credential using SimpleWebAuthn
    const responseData = await startRegistration({
      optionsJSON: optionsData,
    });

    // Send response to server for verification
    const verifyResult = await account.verifyPasskeyRegistration({
      name,
      registration: responseData,
    });

    return verifyResult.verified;
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
    const authData = await account.getPasskeyAuthenticationOptions();
    const { sessionID, options } = authData;

    // Get credential using SimpleWebAuthn
    const responseData = await startAuthentication({
      optionsJSON: options,
    });

    // Send response to server for verification
    const verifyResult = await account.verifyPasskeyAuthentication({
      sessionID,
      response: responseData,
    });

    const { verified, user } = verifyResult;
    if (!verified) {
      throw new Error("Authentication failed");
    }

    return user;
  } catch (error) {
    console.error("Error using passkey:", error);
    throw error;
  }
};
