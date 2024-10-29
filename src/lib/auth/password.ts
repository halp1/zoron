import { randomBytes, pbkdf2 } from "crypto";

export const hashPassword = async (password: string) => {
  // use nodejs crypto
  const salt = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, 1000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve({ salt, hash: derivedKey.toString("hex") });
    });
  });
};

export const verifyPassword = (password: string, salt: string, hash: string) => {
  return new Promise<boolean>((resolve, reject) => {
    pbkdf2(password, salt, 1000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(hash === derivedKey.toString("hex"));
    });
  });
};