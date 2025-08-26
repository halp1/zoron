<script lang="ts">
  import { quadIn } from "svelte/easing";
  import { fade, fly, scale } from "svelte/transition";

  import { page } from "$app/state";

  import { motion } from "@zoron/common/motion";
  import { requests, toast } from "@zoron/common/web";
  import { theme } from "@zoron/common/web/theme";

  import { signIn, signOut } from "@auth/sveltekit/client";

  import Fa from "svelte-fa";

  import {
    faClose,
    faGear,
    faHome,
    faKey,
    faRightFromBracket,
    faUserEdit,
    faUserFriends,
    faUserSlash
  } from "@fortawesome/free-solid-svg-icons";

  if (!page.data?.session || !page.data.session?.user) {
    signIn();
  }

  let deleting: number = -1;
  let deleteInterval: NodeJS.Timeout | null = null;
  const unclickDeleteAccountButton = () => {
    if (deleteInterval) clearInterval(deleteInterval);
    deleting = 0;
  };
</script>

<svelte:head>
  <title>Account | {page.data.env.name}</title>
</svelte:head>

<main>
  <div class="flex h-screen w-screen flex-col items-center justify-center">
    {#if page.data && page.data.session && page.data.session.user}
      <div class="relative flex flex-col gap-5 sm:w-[550px]">
        <div
          class="mx-auto border-b-2 border-slate-600 pb-1 text-3xl"
          in:fly|global={{
            delay: 250,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20, 1.2)
          }}
        >
          Hello, {page.data.session.user.name}.
        </div>
        <div
          class="flex items-center justify-center gap-3 text-xl"
          in:fly|global={{
            delay: 350,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        ></div>
        <a
          href="/home"
          class="btn-full btn-outlined theme-override mx-auto flex items-center justify-center gap-3 border-green-400 text-base"
          in:fly|global={{
            delay: 450,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        >
          <span
            in:scale|global={{
              delay: 500,
              duration: 1000,
              opacity: 0,
              start: 0,
              easing: motion.transitions.spring(400, 20)
            }}><Fa icon={faHome} /></span
          >
          Home
        </a>
        <div
          class="border-b-2 border-dashed border-slate-600"
          in:fly|global={{
            delay: 550,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        ></div>
        <div class="grid grid-cols-2 gap-2">
          <a
            href="/account/settings"
            class="btn-full btn-outlined theme-override flex flex-1 items-center justify-center gap-3 border-blue-400 text-base"
            in:fly|global={{
              delay: 600,
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            <Fa icon={faGear} />
            Settings
          </a>
          {#if page.data.session.user.password}
            <a
              href="/account/password"
              class="btn-full btn-outlined theme-override flex flex-1 items-center justify-center gap-3 border-orange-400 text-base"
              in:fly|global={{
                delay: 700,
                duration: 1000,
                opacity: 0,
                y: -20,
                easing: motion.transitions.spring(400, 20)
              }}
            >
              <Fa icon={faKey} />
              Update password
            </a>
          {:else}
            <a
              href="/account/password"
              class="btn-full btn-outlined theme-override flex flex-1 items-center justify-center gap-3 border-orange-400 text-base"
              in:fly|global={{
                delay: 700,
                duration: 1000,
                opacity: 0,
                y: -20,
                easing: motion.transitions.spring(400, 20)
              }}
            >
              <Fa icon={faKey} />
              Add a password
            </a>
          {/if}
          <button
            onclick={async (e) => {
              e.preventDefault();
              await signOut({ redirect: true, callbackUrl: "/" });
              toast.success("You have been signed out.");
            }}
            class="btn-full btn-outlined theme-override col-span-1 flex flex-1 items-center justify-center gap-3 border-red-500 text-base"
            in:fly|global={{
              delay: 800,
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            <Fa icon={faRightFromBracket} />
            Sign out
          </button>
          <button
            onclick={() => {
              deleting = 0;
            }}
            class="btn-full btn-outlined theme-override col-span-1 flex flex-1 items-center justify-center gap-3 border-red-500 text-base"
            in:fly|global={{
              delay: 900,
              duration: 1000,
              opacity: 0,
              y: -20,
              easing: motion.transitions.spring(400, 20)
            }}
          >
            <Fa icon={faUserSlash} />
            Delete account
          </button>
        </div>
      </div>
    {:else}
      <button
        class="btn-full"
        in:fly|global={{
          delay: 100,
          duration: 1000,
          opacity: 0,
          y: -20,
          easing: motion.transitions.spring(400, 20)
        }}
        onclick={async () => {
          signIn();
        }}
      >
        Log in
      </button>
    {/if}
  </div>
  <!-- delete modal thingy -->
  {#if deleting !== -1}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="fixed top-0 right-0 bottom-0 left-0 grid place-items-center backdrop-blur-md"
      transition:fade={{
        duration: 200
      }}
      onclick={({ currentTarget, target }) => {
        if (currentTarget === target) deleting = -1;
      }}
    >
      <div
        class="relative flex flex-col items-center rounded-lg {$theme ===
        'amoled'
          ? 'border-2 border-white bg-black'
          : 'bg-slate-800'} p-5"
      >
        <button
          class="btn-circle absolute top-2 right-2"
          onclick={() => {
            deleting = -1;
          }}
          in:fly|global={{
            delay: 250,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        >
          <Fa icon={faClose} />
        </button>
        <div
          class="text-2xl"
          in:fly|global={{
            delay: 350,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        >
          Delete your account?
        </div>
        <div
          class="text-sm text-slate-400"
          in:fly|global={{
            delay: 450,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        >
          This action is irreversible.
        </div>
        <div
          class="btn-full btn-outlined theme-override relative mt-5 flex w-72 items-center justify-center overflow-hidden border-red-500 text-base text-transparent"
          in:fly|global={{
            delay: 550,
            duration: 1000,
            opacity: 0,
            y: -20,
            easing: motion.transitions.spring(400, 20)
          }}
        >
          Delete account
          <div
            class="pointer-events-none absolute left-0 h-full bg-red-500/40 transition-all {deleting ===
            0
              ? 'duration-200'
              : 'duration-0'}"
            style="width: {deleting}%;"
          ></div>
          <button
            onmousedown={async () => {
              deleteInterval = setInterval(async () => {
                deleting += 0.5;
                if (deleting >= 100) {
                  deleting = -1;
                  // @ts-expect-error
                  clearInterval(deleteInterval);
                  const { dismiss } = toast.loading("Deleting account...");
                  const res = await requests.del("/api/account/delete");
                  if (res.success) {
                    toast.success("Account deleted.");
                    await signOut({ redirect: true, callbackUrl: "/" });
                  } else {
                    toast.error(
                      "An error occurred while deleting your account: " +
                        res.error
                    );
                  }
                  dismiss();
                }
              }, 1000 / 120);
            }}
            onmouseup={unclickDeleteAccountButton}
            onmouseleave={unclickDeleteAccountButton}
            ontouchstart={async () => {
              deleteInterval = setInterval(async () => {
                deleting += 0.5;
                if (deleting >= 100) {
                  deleting = -1;
                  // @ts-expect-error
                  clearInterval(deleteInterval);
                  const { dismiss } = toast.loading("Deleting account...");
                  const res = await requests.del("/api/account/delete");
                  if (res.success) {
                    toast.success("Account deleted.");
                    await signOut({ redirect: true, callbackUrl: "/" });
                  } else {
                    toast.error(
                      "An error occurred while deleting your account: " +
                        res.error
                    );
                  }
                  dismiss();
                }
              }, 1000 / 120);
            }}
            ontouchend={unclickDeleteAccountButton}
            ontouchcancel={unclickDeleteAccountButton}
            class="absolute top-0 right-0 bottom-0 left-0 z-10 flex items-center justify-center text-white"
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  {/if}
</main>
