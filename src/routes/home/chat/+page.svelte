<script lang="ts">
  import { supabase } from "$lib/supabase";
  $: if ($supabase) {
    const channel = $supabase.channel("chat/global", {
			config: {
				broadcast: {
					self: true
				}
			}
		});
    channel.subscribe((status) => {
      console.log(status);

      // if (status !== "SUBSCRIBED") {
      //   return null;
      // }

      // Send a message once the client is subscribed
      channel.send({
        type: "broadcast",
        event: "test",
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
