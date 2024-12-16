<script lang="ts">
  import { supabase } from "$lib/supabase";
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
      channel.on("broadcast", { event: "message" }, (message) => {
        console.log(message.payload);
      });

      // Send a message once the client is subscribed
      await channel.send({
        type: "broadcast",
        event: "message",
        payload: { message: "hello, world" }
      });
    });
  }
</script>

<div class="flex flex-grow flex-col items-center justify-center">
  <div class="text-4xl">Welcome to Zoron Chat.</div>
  {!!$supabase}
  {$supabase?.realtime?.isConnected()}
</div>
