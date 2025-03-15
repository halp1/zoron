import type { Writable } from "svelte/store";

const GLOBAL_KEY = `zoron.${import.meta.env.DEV ? "dev" : "prod"}`;

export const useStorage = (
  name: string,
  value: Writable<string | number | object>
) => {
  const key = `${GLOBAL_KEY}.${name}`;
  const currentValue = localStorage.getItem(key);
  if (currentValue) {
    value.set(JSON.parse(currentValue));
  }
  return value.subscribe((val) => {
    localStorage.setItem(key, JSON.stringify(val));
  });
};
