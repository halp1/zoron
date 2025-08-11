<script lang="ts">
  import { fly } from "svelte/transition";

  import { onMount } from "svelte";

  import { page } from "$app/state";

  import { motion } from "@zoron/common/motion";
  import { supabaseConnect } from "@zoron/common/supabase";

  import Fa from "svelte-fa";

  import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
  import { faGlobe } from "@fortawesome/free-solid-svg-icons/faGlobe";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  let chats:
    | (({ title: string } | { icon: IconDefinition }) & { id: string })[]
    | null = $state(null);

  onMount(() => {
    const client = supabaseConnect(
      page.data.env.supabase.uri,
      page.data.env.supabase.key
    );
    client.auth.setSession(page.data.supabase.session);
    chats = [{ id: "global", icon: faGlobe }];
    return () => {
      client.removeAllChannels();
      client.realtime.disconnect();
    };
  });

  let currentChatId = $derived(page.params.id);
</script>

<div
  class="chat-container -mx-10 flex h-full flex-col-reverse items-stretch md:flex-row"
>
  <div
    class="flex h-16 gap-3 rounded-r-md bg-slate-950 px-3 md:h-auto md:w-16 md:flex-col md:px-0 md:py-3"
    style="view-transition-name: none"
  >
    {#if chats}
      {#each chats as chat, idx}
        <a
          in:fly|global={{
            delay: 250 + idx * 50,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
          href="/home/chat/chat/{chat.id}"
          class="my-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full {currentChatId ===
          chat.id
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-slate-900 hover:bg-slate-800'} md:mx-auto md:my-0"
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
        <img
          src="/favicon.png"
          alt="icon"
          class="absolute left-1/2 top-1/2 w-6 -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    {/if}
  </div>
  {@render children?.()}
</div>
