<script lang="ts">
  import { fly } from "svelte/transition";

  import { onMount } from "svelte";

  import { page } from "$app/state";

  import { Toggle } from "@zoron/common/components";
  import { motion } from "@zoron/common/motion";
  import { requests, toast } from "@zoron/common/web";
  import { theme } from "@zoron/common/web/theme";

  import Fa from "svelte-fa";

  import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

  let tick = $state(0);
  onMount(() => {
    let frame;
    const t = () => {
      tick = tick + 1;
      requestAnimationFrame(t);
    };

    frame = requestAnimationFrame(t);
    return () => cancelAnimationFrame(frame);
  });
</script>

<div
  class="mb-3 mt-10 text-center text-4xl"
  in:fly|global={{
    delay: 250,
    duration: 1000,
    opacity: 0,
    y: -20,
    easing: motion.transitions.spring(400, 20)
  }}
>
  Admin Panel
</div>
<div
  class="mb-10 grid grid-cols-1 gap-5 px-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
>
  <div
    class="rounded-3xl border-2 {$theme === 'amoled'
      ? 'border-white'
      : 'border-red-400'} {$theme === 'amoled'
      ? 'bg-black'
      : 'bg-slate-800'} p-5"
    in:fly|global={{
      delay: 350,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
  >
    <div class="text-2xl">Time Delta</div>
    <form
      onsubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const hours = formData.get("hours");
        const minutes = formData.get("minutes");
        const period = formData.get("period");
        if (
          hours &&
          minutes &&
          period &&
          !isNaN(Number(hours)) &&
          !isNaN(Number(minutes))
        ) {
          const target = new Date();
          target.setHours(
            period === "PM" ? Number(hours) + 12 : Number(hours),
            Number(minutes),
            0,
            0
          );
          const delta = target.getTime() - new Date().getTime();
          const res = await requests.post("/api/admin/time-delta", { delta });
          if (res.success === true) {
            toast.success("Time delta updated");
            history.go(0);
          } else {
            toast.error("Failed to update time delta: " + res.error);
          }
        } else {
          toast.error("Invalid time");
        }
      }}
    >
      <div class="flex items-center gap-2">
        <div class="">
          Current time:
          {#key tick}
            {new Date().toLocaleTimeString()}
          {/key}
        </div>
        <div>
          △ Time:
          {#key tick}
            {(page.data.timeDelta.data / 1000).toFixed(1)} seconds
          {/key}
        </div>
      </div>
      <div class="flex items-center gap-1">
        Target:
        <input
          name="hours"
          type="number"
          class="w-10 rounded-full border-2 {$theme === 'amoled'
            ? 'border-white'
            : 'border-slate-600'} bg-transparent px-2 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="HH"
        />:
        <input
          name="minutes"
          type="number"
          class="w-10 rounded-full border-2 {$theme === 'amoled'
            ? 'border-white'
            : 'border-slate-600'} bg-transparent px-2 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="MM"
        />
        <select name="period" class="bg-transparent outline-none">
          <option value="AM" class="text-black">AM</option>
          <option value="PM" class="text-black">PM</option>
        </select>
      </div>
      <button
        type="submit"
        class="btn-outlined btn-full mt-2 w-full {$theme === 'amoled'
          ? 'border-white'
          : 'border-red-400'} text-base"
      >
        Update
      </button>
    </form>
  </div>

  <div
    class="rounded-3xl border-2 {$theme === 'amoled'
      ? 'border-white'
      : 'border-red-400'} {$theme === 'amoled'
      ? 'bg-black'
      : 'bg-slate-800'} p-5"
    in:fly|global={{
      delay: 450,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
  >
    <div class="text-2xl">Debug</div>
    <form
      class="flex flex-1 flex-wrap gap-2"
      onsubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const name = formData.get("name") || "";
        const email = formData.get("email") || "";
        if (name === "" && email === "") {
          toast.error("One of name or email required");
          return;
        }
        if (name !== "" && email !== "") {
          toast.error("Please enter only one of name or email");
          return;
        }

        const target = name === "" ? { email } : { name };
        const tokenRes = await requests.post("/api/admin/impersonate/token");
        if (tokenRes.success === false)
          return toast.error("Failed to get token: " + tokenRes.error);
        // @ts-expect-error property not exist
        target.token = tokenRes.data.token;
        const res = await requests.post("/api/admin/impersonate", target);
        if (res.success === true) {
          // @ts-expect-error implicit any
          toast.success("Debugging " + (target[Object.keys(target)[0]] || ""));
          location.href = "/home/schedule";
        } else {
          toast.error("Failed to impersonate: " + res.error);
        }
      }}
    >
      <input
        type="text"
        name="name"
        class="w-full rounded-full border-2 border-dashed {$theme === 'amoled'
          ? 'border-white'
          : 'border-slate-600'} bg-transparent px-2 text-center outline-none focus-within:border-solid"
        placeholder="Name"
      />
      <input
        type="text"
        name="email"
        class="w-full rounded-full border-2 border-dashed {$theme === 'amoled'
          ? 'border-white'
          : 'border-slate-600'} bg-transparent px-2 text-center outline-none focus-within:border-solid"
        placeholder="Email"
      />
      <button
        type="submit"
        class="btn-outlined btn-full mt-auto w-full {$theme === 'amoled'
          ? 'border-white'
          : 'border-red-400'} text-base"
      >
        Go
      </button>
    </form>
  </div>

  <div
    class="rounded-3xl border-2 {$theme === 'amoled'
      ? 'border-white'
      : 'border-red-400'} {$theme === 'amoled'
      ? 'bg-black'
      : 'bg-slate-800'} p-5"
    in:fly|global={{
      delay: 550,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
  >
    <div class="text-2xl">Copy User</div>
    <form
      class="flex flex-1 flex-wrap gap-2"
      onsubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("copy-name") || "";
        const email = formData.get("copy-email") || "";

        if (name === "" && email === "") {
          toast.error("One of name or email required");
          return;
        }
        if (name !== "" && email !== "") {
          toast.error("Please enter only one of name or email");
          return;
        }

        const res = await requests.post("/api/admin/copy-user", {
          name,
          email
        });
        if (res.success === true) {
          toast.success("User copied successfully");
          // @ts-expect-error you can't use as, etc in inline event handlers in svelte
          e.target.reset();
        } else {
          toast.error("Failed to copy user: " + res.error);
        }
      }}
    >
      <input
        type="text"
        name="copy-name"
        class="w-full rounded-full border-2 border-dashed {$theme === 'amoled'
          ? 'border-white'
          : 'border-slate-600'} bg-transparent px-2 text-center outline-none focus-within:border-solid"
        placeholder="Name"
      />
      <input
        type="text"
        name="copy-email"
        class="w-full rounded-full border-2 border-dashed {$theme === 'amoled'
          ? 'border-white'
          : 'border-slate-600'} bg-transparent px-2 text-center outline-none focus-within:border-solid"
        placeholder="Email"
      />
      <button
        type="submit"
        class="btn-outlined btn-full mt-2 w-full {$theme === 'amoled'
          ? 'border-white'
          : 'border-red-400'} text-base"
      >
        Copy to Dev DB
      </button>
    </form>
  </div>
  <button
    class="rounded-3xl border-2 text-7xl {$theme === 'amoled'
      ? 'border-white'
      : 'border-red-400'} {$theme === 'amoled'
      ? 'bg-black'
      : 'bg-slate-800'} p-5"
    in:fly|global={{
      delay: 550,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
    onclick={async () => {
      const res = await requests.post<string>("/api/admin/upgrade");
      if (res.success === true) {
        toast.success(res.data);
      } else {
        toast.error("Failed to restart Zoron: " + res.error);
      }
    }}
  >
    Restart Zoron
  </button>
  <div
    class="flex flex-col gap-2 rounded-3xl border-2 {$theme === 'amoled'
      ? 'border-white'
      : 'border-red-400'} {$theme === 'amoled'
      ? 'bg-black'
      : 'bg-slate-800'} p-5"
    in:fly|global={{
      delay: 550,
      duration: 1000,
      opacity: 0,
      y: -20,
      easing: motion.transitions.spring(400, 20)
    }}
  >
    <div class="text-3xl">Tools</div>
    <a
      href="/home/admin/logs"
      class="flex items-center gap-2 text-xl underline"
    >
      View Logs <Fa icon={faArrowRight} />
    </a>
  </div>
</div>
