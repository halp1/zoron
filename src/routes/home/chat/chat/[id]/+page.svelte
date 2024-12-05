<script lang="ts">
  import { supabase } from "$lib/supabase";
  import { page } from "$app/stores";
  import type { Chat } from "$lib/types";
  import { toast } from "$lib/web";

  const id = $page.params.id;
  let channel = $supabase?.realtime?.channel("chat/" + id);

  let messages: Chat.Message[] = [];

  $: if (channel) {
    channel.on(
      "broadcast",
      {
        event: "message"
      },
      (message) => {
        messages = [...messages, message.payload];
      }
    );
  }

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
          name: $page.data.session?.user?.name!,
          icon: $page.data.session?.user?.image!
        },
        message,
        timestamp: Date.now()
      } satisfies Chat.Message
    });
  };

  let input: HTMLTextAreaElement;
</script>

<div class="flex flex-grow flex-col">
  <div class="flex-grow"></div>
  <div class="m-3 flex rounded-md bg-slate-800">
    <textarea
      bind:this={input}
      class="flex-grow resize-none overflow-y-hidden bg-transparent p-2 text-white outline-none focus-within:outline-none"
      cols="1"
      on:keydown={(e) => {
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
      on:input={(e) => {
        e.currentTarget.style.height = "auto";
        e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
      }}
      placeholder="Type a message..."
    ></textarea>
  </div>
</div>
