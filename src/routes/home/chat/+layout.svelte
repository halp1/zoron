<script lang="ts">
  import { supabaseConnect } from "$lib/supabase";
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  onMount(() => {
    const client = supabaseConnect($page.data.env.supabase.uri, $page.data.env.supabase.key);
		client.auth.setSession($page.data.supabase.session);
    return () => {
      client.removeAllChannels();
    };
  });
</script>

<div class="chat-container -mx-10 flex h-full flex-col-reverse items-stretch md:flex-row">
  <div class="flex flex-col"></div>
  <slot />
</div>
