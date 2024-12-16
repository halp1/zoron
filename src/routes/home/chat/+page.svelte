<script lang="ts">
  import { supabase } from "$lib/supabase";
  let connected = false;
  $: if ($supabase) {
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
</script>

<div class="flex flex-grow flex-col items-center justify-center">
  <div class="text-4xl">Welcome to Zoron Chat.</div>
  <div>Initialized: {!!$supabase}</div>
  <div>Connected: {connected}</div>
</div>
