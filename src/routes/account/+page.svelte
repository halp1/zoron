<script lang="ts">
  import { page } from "$app/stores";
  import { signIn } from "@auth/sveltekit/client";
  import Fa from "svelte-fa";
  import {
    faShare,
    faTrash,
    faEye,
    faCopy,
    faXmark,
    faBullhorn,
    faLink,
    faAdd
  } from "@fortawesome/free-solid-svg-icons";
  import toast from "svelte-french-toast";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { getDeviceInfo, type Device } from "$lib/web";

  let keysShown = $page.data.account.items && $page.data.account.items.map(() => false);

  let device: Device | null = null;
  onMount(() => {
    (async () => {
      device = await getDeviceInfo();
    })();
  });
</script>

<main>
  <div class="flex h-screen w-screen flex-col items-center justify-center">
    {#if $page.data && $page.data.session && $page.data.session.user}
      <div class="relative flex flex-col sm:w-[450px]">
        <div class="mx-auto border-b-2 border-slate-600 pb-1 text-3xl">
          Hello, {$page.data.session.user.email}.
        </div>
        <div class="relative mt-5 flex w-full flex-col">
          <div class="mb-1 text-2xl">Your Push Groups</div>
          <div class="flex w-full flex-col border-2 border-slate-600 p-3">
            {#if $page.data.account.items.length === 0}
              <span
                >You have no push groups. You can create one <a href="/create" class="underline"
                  >here</a
                >.</span
              >
            {:else}
              {#each $page.data.account.items as item, index}
                <div class="mb-2 flex w-full flex-col border-2 border-dashed border-slate-600 p-3">
                  <div class="flex items-center">
                    <div class="border-b-[1px] border-slate-600 text-2xl">{item.name}</div>
                    <div class="ml-auto flex items-center rounded-full border-2 border-slate-600">
                      <a href="/push" class="btn-circle" title="Send a Push">
                        <Fa icon={faBullhorn} />
                      </a>
                      <button
                        on:click={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `Subscribe to ${item.name}!`,
                              text: `Subscribe to ${item.name} at https://push.haelp.dev/subscribe/${item._id}`,
                              url: `https://push.haelp.dev/subscribe/${item._id}`
                            });
                          } else {
                            navigator.clipboard.writeText(
                              `https://push.haelp.dev/subscribe/${item._id}`
                            );
                            toast.success("Link copied to clipboard!", {
                              position: "bottom-right"
                            });
                          }
                        }}
                        class="btn-circle"
                        title="Invite Others"
                        ><Fa icon={faShare} />
                      </button>
                      <button
                        on:click={() => {
                          navigator.clipboard.writeText(
                            `https://push.haelp.dev/subscribe/${item._id}`
                          );
                          toast.success("Link copied to clipboard!", {
                            position: "bottom-right"
                          });
                        }}
                        class="btn-circle"
                        title="Copy link"
                      >
                        <Fa icon={faLink} />
                      </button><button
                        on:click={() => {
                          goto(`/subscribe/${item._id}`);
                        }}
                        class="btn-circle"
                        title="Subscribe"
                      >
                        <Fa icon={faAdd} />
                      </button>
                      <button
                        class="btn-circle"
                        title="Delete Group"
                        on:click={async () => {
                          if (
                            !confirm(
                              "Are you sure you want to delete this group?\nEveryone that is currently subscribed will be unsubscribed.\nYou can not undo this action."
                            )
                          )
                            return;
                          await fetch(`/api/delete/${item._id}`, {
                            method: "DELETE"
                          });
                          history.go(0);
                        }}
                      >
                        <Fa icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  <div class="mt-2 flex w-full items-center gap-3 text-lg">
                    Key:
                    {#if keysShown[index]}
                      <code
                        class="w-full overflow-hidden whitespace-normal rounded-sm bg-slate-700 bg-transparent text-sm"
                      >
                        {item.key}
                      </code>
                      <button
                        class="btn-circle"
                        title="Copy Key"
                        on:click={() => {
                          navigator.clipboard.writeText(item.key);
                          toast.success("Link copied to clipboard!", { position: "bottom-right" });
                        }}
                      >
                        <Fa icon={faCopy} />
                      </button>
                    {:else}
                      <input
                        type="password"
                        disabled={!keysShown[index]}
                        value={item.key}
                        class="w-full overflow-hidden bg-transparent"
                      />
                    {/if}
                    <button
                      class="btn-circle"
                      title="Show/Hide Key"
                      on:click={() => {
                        keysShown[index] = !keysShown[index];
                      }}
                    >
                      <Fa icon={faEye} />
                    </button>
                  </div>
                  <div class="flex flex-row justify-end"></div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
        <div class="relative mt-5 flex w-full flex-col">
          <div class="mb-1 text-2xl">Your Subscriptions</div>
          <div class="flex w-full flex-col border-2 border-slate-600 p-3">
            {#if $page.data.account.subscriptions.length === 0}
              <span>You have no subscriptions.</span>
            {:else}
              {#each $page.data.account.subscriptions as sub, index}
                <div class="mb-2 flex w-full flex-col border-2 border-dashed border-slate-600 p-3">
                  <div class="flex items-center">
                    <div class="border-b-[1px] border-slate-600 text-2xl">{sub.item}</div>
                    <div class="text-md ml-2 text-slate-600">
                      on
                      {sub?.device?.browser}
                      {sub?.device?.os}
                      {sub?.device?.fingerprint === device?.fingerprint ||
                      sub?.device.id === device?.id
                        ? "(this device)"
                        : ""}
                    </div>
                    <div class="ml-auto flex items-center rounded-full border-2 border-slate-600">
                      <button
                        on:click={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `Subscribe to ${sub.item}!`,
                              text: `Subscribe to ${sub.item} at https://push.haelp.dev/subscribe/${sub.target}`,
                              url: `https://push.haelp.dev/subscribe/${sub.target}`
                            });
                          } else {
                            navigator.clipboard.writeText(
                              `https://push.haelp.dev/subscribe/${sub.target}`
                            );
                            toast.success("Link copied to clipboard!", {
                              position: "bottom-right"
                            });
                          }
                        }}
                        class="btn-circle"
                        title="Invite Others"
                      >
                        <Fa icon={faShare} />
                      </button>
                      <button
                        class="btn-circle"
                        title="Unsubscribe"
                        on:click={async () => {
                          if (
                            !confirm(
                              "Are you sure you want to unsubscribe?\nYou can not undo this action."
                            )
                          )
                            return;
                          await fetch(`/api/unsubscribe/${sub.target}`, {
                            method: "POST"
                          });
                          history.go(0);
                        }}
                      >
                        <Fa icon={faXmark} />
                      </button>
                    </div>
                  </div>

                  <div class="flex flex-row justify-end"></div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <button
        class="btn-full"
        on:click={async () => {
          signIn();
        }}
      >
        Log in
      </button>
    {/if}
  </div>
</main>
