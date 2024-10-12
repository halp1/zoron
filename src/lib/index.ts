export namespace key {
  export const characters = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM-";
  export const generate = (length: number) =>
    Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join(
      ""
    );
}
