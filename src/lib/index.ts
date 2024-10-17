export namespace key {
  export const characters = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM-";
  export const generate = (length: number) =>
    Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join(
      ""
    );
}

export const autoCatch = <T>(fn: () => T): T | undefined => {
	try {
		return fn();
	} catch {
		return undefined;
	}
}