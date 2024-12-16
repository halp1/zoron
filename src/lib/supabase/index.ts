import { type Writable, get, writable } from "svelte/store";

import { createClient } from "@supabase/supabase-js";

export let supabase: Writable<ReturnType<typeof createClient> | null> = writable(null);
export const supabaseConnect = (uri: string, key: string, store = true) => {
  console.log(uri, key);
  const c = createClient(uri, key);
  c.realtime.connect();
  if (store) {
    setTimeout(async () => {
      console.log("waiting for connection:", c.realtime.connectionState());
      while (!c.realtime.isConnected()) {
        console.log("waiting for connection:", c.realtime.connectionState());
        await new Promise((r) => setTimeout(r, 100));
      }
			console.log("connected:", c.realtime.connectionState());
      supabase.set(c as any);
    }, 1);
  }
  return c;
};

const client = () => get(supabase);

export namespace realtime {
  export const open = (channel: string) => client()?.channel(channel)!;
}
