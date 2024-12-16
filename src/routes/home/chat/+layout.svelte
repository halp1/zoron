<script lang="ts">
  import { supabaseConnect } from "$lib/supabase";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { faGlobe, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";

  let chats: (({ title: string } | { icon: IconDefinition }) & { id: string })[] | null = null;

  onMount(() => {
    const client = supabaseConnect($page.data.env.supabase.uri, $page.data.env.supabase.key);
    client.auth.setSession($page.data.supabase.session);
    chats = [{ id: "global", icon: faGlobe }];
    return () => {
      client.removeAllChannels();
      client.realtime.disconnect();
    };
  });
</script>

<div class="chat-container -mx-10 flex h-full flex-col-reverse items-stretch md:flex-row">
  <div class="flex w-16 flex-col gap-3 rounded-r-md bg-slate-950 py-3">
    {#if chats}
      {#each chats as chat}
        <a
          href="/home/chat/chat/{chat.id}"
          class="mx-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800"
        >
          {#if "icon" in chat}
            <Fa icon={chat.icon} class="text-2xl text-white" />
          {:else}
            <div class="text-2xl text-white">{chat.title[0]}</div>
          {/if}
        </a>
      {/each}
    {:else}
      <div class="relative mx-auto my-auto">
        <div
          class="mx-auto my-auto h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-slate-600"
        ></div>
        <img src="/favicon.png" alt="icon" class="absolute w-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
    {/if}
  </div>
  <slot />
</div>
