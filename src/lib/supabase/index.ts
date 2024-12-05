import { type Writable, get, writable } from "svelte/store";

import { createClient } from "@supabase/supabase-js";

export let supabase: Writable<ReturnType<typeof createClient> | null> = writable(null);
export const supabaseConnect = (id: string, key: string) => {
  const c = createClient(`https://${id}.supabase.co`, key);
  c.realtime.connect();
  supabase.set(c as any);

  setTimeout(async () => {
    console.log("waiting for connection:", c.realtime.connectionState());
    while (!c.realtime.isConnected()) {
      console.log("waiting for connection:", c.realtime.connectionState());
      await new Promise((r) => setTimeout(r, 100));
    }
    supabase.set(c as any);
  }, 1);
  return c;
};

const client = () => get(supabase);

export namespace realtime {
  export const open = (channel: string) => client()?.channel(channel)!;
}
