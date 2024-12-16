import { type Writable, get, writable } from "svelte/store";

import { createClient } from "@supabase/supabase-js";

export let supabase: Writable<ReturnType<typeof createClient> | null> = writable(null);
export const supabaseConnect = (uri: string, key: string, store = true) => {
  const c = createClient(uri, key);
  c.realtime.connect();
  if (store) {
    setTimeout(async () => {
      while (!c.realtime.isConnected()) {
        await new Promise((r) => setTimeout(r, 100));
      }
      supabase.set(c as any);
    }, 1);
  }
  return c;
};

const client = () => get(supabase);

export namespace realtime {
  export const open = (channel: string) => client()?.channel(channel)!;
}
