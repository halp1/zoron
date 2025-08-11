<script lang="ts">
  import { fly } from "svelte/transition";

  import { page } from "$app/state";

  import { motion } from "@zoron/common/motion";
  import { supabase } from "@zoron/common/supabase";

  let connected = $state(false);
  $effect(() => {
    if ($supabase) {
      const channel = $supabase.channel("chat/global", {
        config: {
          broadcast: {
            ack: true,
            self: true
          }
        }
      });
      channel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return null;
        }
        connected = true;
      });
    }
  });
</script>

<svelte:head>
  <title>Chat | {page.data.env.name}</title>
</svelte:head>

<div class="flex flex-grow flex-col items-center justify-center">
  <div
    class="text-4xl"
    in:fly|global={{
      delay: 250,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
  >
    Welcome to Zoron Chat.
  </div>
  <div
    in:fly|global={{
      delay: 350,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
  >
    Initialized: {!!$supabase}
  </div>
  <div
    in:fly|global={{
      delay: 450,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
  >
    Connected: {connected}
  </div>
  <div
    in:fly|global={{
      delay: 550,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
    class="mt-3 text-center text-sm text-slate-400"
  >
    {page.data.env.name} is a heavy work in progress.<br />
    Chat will not connect on the LHS school wifi.
  </div>
</div>
