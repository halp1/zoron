<script lang="ts">
  import { run } from "svelte/legacy";

  import { page } from "$app/state";

  import { supabase } from "$lib/supabase";
  import type { Chat } from "$lib/types";
  import { toast } from "$lib/web";

  import { RealtimeChannel } from "@supabase/supabase-js";

  const id = page.params.id;
  let channel: RealtimeChannel | null = $state(null);

  let messages: Chat.Message[] = $state([]);

  run(() => {
    if ($supabase) {
      channel = $supabase?.realtime?.channel("chat/" + id, {
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
        channel!.on(
          "broadcast",
          {
            event: "message"
          },
          (message) => {
            messages = [...messages, message.payload];
          }
        );
      });
    }
  });

  const chat = (message: string) => {
    channel!.send({
      type: "broadcast",
      event: "message",
      payload: {
        id:
          Math.random().toString(36).substring(7) +
          "-" +
          Math.random().toString(36).substring(7) +
          "-" +
          Math.random().toString(36).substring(7),
        user: {
          name: page.data.session?.user?.name!,
          icon: page.data.session?.user?.image!
        },
        message,
        timestamp: Date.now()
      } satisfies Chat.Message
    });
  };

  let input: HTMLTextAreaElement = $state();

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Generate a consistent color based on username
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500"
    ];
    const index =
      name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };
</script>

<svelte:head>
  <title>Chat | {page.data.env.name}</title>
</svelte:head>

<div class="flex flex-grow flex-col">
  <div class="flex-grow overflow-y-auto p-4">
    {#each messages as message (message.id)}
      <div class="mb-4 flex items-start">
        {#if message.user.icon}
          <img
            src={message.user.icon}
            alt={message.user.name}
            class="h-10 w-10 rounded-full"
          />
        {:else}
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full {getAvatarColor(
              message.user.name
            )}"
          >
            <span class="text-lg font-medium text-white"
              >{getInitial(message.user.name)}</span
            >
          </div>
        {/if}
        <div class="ml-3">
          <div class="flex items-baseline">
            <span class="font-medium text-white">{message.user.name}</span>
            <span class="ml-2 text-xs text-gray-400"
              >{formatTimestamp(message.timestamp)}</span
            >
          </div>
          <p class="mt-1 text-gray-200">{message.message}</p>
        </div>
      </div>
    {/each}
  </div>
  <div class="m-3 flex rounded-md bg-slate-800">
    <textarea
      bind:this={input}
      class="flex-grow resize-none overflow-y-hidden bg-transparent p-2 text-white outline-none focus-within:outline-none"
      cols="1"
      onkeydown={(e) => {
        if (e.key === "Enter") {
          if (!e.shiftKey) {
            e.preventDefault();
            const message = e.currentTarget.value;
            e.currentTarget.value = "";
            if (!channel) return toast.error("Not connected");
            chat(message);
          }
        }
      }}
      oninput={(e) => {
        e.currentTarget.style.height = "auto";
        e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
      }}
      placeholder="Type a message..."
    ></textarea>
  </div>
</div>
