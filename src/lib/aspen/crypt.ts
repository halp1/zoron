import { ASPEN_IV, ASPEN_KEY } from "$env/static/private";
import crypto from "node:crypto";

const makeBuffer32 = (buffer: Buffer) => Buffer.concat([buffer, Buffer.alloc(32)], 32);

const algorithm = "aes-256-cbc" as const;

export const encrypt = (secret: string, username: string, password: string) => {
  const merged = `${username}:${password}`;
  const key = ASPEN_KEY!;
  const iv = ASPEN_IV!;
  // first, aes 256 encrypt against the secret
  const secret32 = makeBuffer32(
    Buffer.from(crypto.createHash("sha256").update(secret).digest("hex"), "hex")
  );
  const cipher = crypto.createCipheriv(algorithm, secret32, Buffer.from(iv, "hex"));
  const encrypted = Buffer.concat([cipher.update(merged, "utf8"), cipher.final()]);
  // then, aes 256 encrypt against the key
  const keyBuffer = Buffer.from(key, "hex");
  const cipher2 = crypto.createCipheriv(algorithm, keyBuffer, Buffer.from(iv, "hex"));
  const encrypted2 = Buffer.concat([cipher2.update(encrypted), cipher2.final()]);
  return encrypted2.toString("hex");
};

export const decrypt = (secret: string, encrypted: string) => {
  const secret32 = makeBuffer32(
    Buffer.from(crypto.createHash("sha256").update(secret).digest("hex"), "hex")
  );
  const key = ASPEN_KEY!;
  const iv = ASPEN_IV!;
  const keyBuffer = Buffer.from(key, "hex");
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, Buffer.from(iv, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final()
  ]);
  const decipher2 = crypto.createDecipheriv(algorithm, secret32, Buffer.from(iv, "hex"));
  const decrypted2 = Buffer.concat([decipher2.update(decrypted), decipher2.final()]);
  const [username, password] = decrypted2.toString("utf8").split(":");
  return { username, password };
};
