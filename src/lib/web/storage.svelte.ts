import { get, type Writable } from "svelte/store";

export namespace storage {
  export const GLOBAL_KEY = `zoron.${import.meta.env.DEV ? "dev" : "prod"}`;

  export const key = (name: string) => `${GLOBAL_KEY}.${name}`;

  export const use = (
    name: string,
    value: Writable<string | number | object | boolean | null | undefined>
  ) => {
    const k = key(name);
    const currentValue = localStorage.getItem(k);
    if (currentValue) {
      value.set(JSON.parse(currentValue));
    } else {
			localStorage.setItem(k, JSON.stringify(get(value)));
		}
    return value.subscribe((val) => {
      localStorage.setItem(k, JSON.stringify(val));
    });
  };
}
