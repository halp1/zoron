import { get, writable, type Writable} from "svelte/store";

import { createClient } from "@supabase/supabase-js";

export namespace supabase {
  export let client: Writable<ReturnType<typeof createClient>>;
  export const connect = (id: string) => {
    client = writable(createClient("https://<project>.supabase.co", "<your-anon-key>"));
    return client;
  };

	const c = () => get(client);

  export namespace realtime {
    export const open = (channel: string) => c().channel(channel);
  }
}
