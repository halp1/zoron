// import { ASPEN_IV, ASPEN_KEY } from '$env/static/private';
const { ASPEN_IV, ASPEN_KEY } = process.env;
import crypto from "node:crypto";

const makeBuffer32 = (buffer: Buffer) => Buffer.concat([buffer, Buffer.alloc(32)], 32);

export const encrypt = (email: string, username: string, password: string) => {
  const merged = `${username}:${password}`;
  const key = ASPEN_KEY!;
  const iv = ASPEN_IV!;
  // first, aes 256 encrypt against the email
  // const email32 = makeBuffer32(
  //   Buffer.from(crypto.createHash("sha256").update(email).digest("hex"), "hex")
  // );
	const email32 = crypto.randomBytes(32);
  const cipher = crypto.createCipheriv("aes-256-ctr", email32, Buffer.from(iv,'hex'));
  const encrypted = Buffer.concat([cipher.update(merged, "utf8"), cipher.final()]);
  // then, aes 256 encrypt against the key
  const keyBuffer = Buffer.from(key, "hex");
  const cipher2 = crypto.createCipheriv("aes-256-ctr", keyBuffer, iv);
  const encrypted2 = Buffer.concat([cipher2.update(encrypted), cipher2.final()]);
  return encrypted2.toString("hex");
};

export const decrypt = (email: string, encrypted: string) => {
  const email32 = makeBuffer32(
    Buffer.from(crypto.createHash("sha256").update(email).digest("hex"), "hex")
  );
  const key = ASPEN_KEY!;
  const iv = ASPEN_IV!;
  const keyBuffer = Buffer.from(key, "hex");
  const decipher = crypto.createDecipheriv("aes-256-ctr", keyBuffer, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final()
  ]);
  const decipher2 = crypto.createDecipheriv("aes-256-ctr", email32, iv);
  const decrypted2 = Buffer.concat([decipher2.update(decrypted), decipher2.final()]);
  const [username, password] = decrypted2.toString("utf8").split(":");
  return { username, password };
};
