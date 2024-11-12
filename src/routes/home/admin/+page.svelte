<script lang="ts">
  import { page } from "$app/stores";
  import { requests, toast } from "$lib/web";
  // "border-red-400" ||
  //   "border-blue-400" ||
  //   "border-purple-400" ||
  //   "border-orange-400" ||
  //   "border-green-400" ||
  //   "border-yellow-400" ||
  //   "border-pink-400" ||

  import { onMount } from "svelte";

  //   "border-indigo-400";
  let tick = 0;
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

<div class="text-center text-4xl">Admin Panel</div>
<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  <div class="rounded-3xl border-2 border-red-400 bg-slate-800 p-5">
    <div class="text-2xl">Time Delta</div>
    <form
      on:submit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const hours = formData.get("hours");
        const minutes = formData.get("minutes");
        const period = formData.get("period");
        if (hours && minutes && period && !isNaN(Number(hours)) && !isNaN(Number(minutes))) {
          const target = new Date();
          target.setHours(
            period === "PM" ? Number(hours) + 12 : Number(hours),
            Number(minutes),
            0,
            0
          );
          const delta = target.getTime() - new Date().getTime();
          console.log(new Date().getTime(), target.getTime(), delta);
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
            {($page.data.timeDelta.data / 1000).toFixed(1)} seconds
          {/key}
        </div>
      </div>
      <div class="flex items-center gap-1">
        Target:
        <input
          name="hours"
          type="number"
          class="w-10 rounded-full border-2 border-slate-600 bg-transparent px-2 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="HH"
        />:
        <input
          name="minutes"
          type="number"
          class="w-10 rounded-full border-2 border-slate-600 bg-transparent px-2 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="MM"
        />
        <select name="period" class="bg-transparent outline-none">
          <option value="AM" class="text-black">AM</option>
          <option value="PM" class="text-black">PM</option>
        </select>
      </div>
      <button type="submit" class="btn-outlined btn-full mt-2 w-full border-red-400 text-base">
        Update
      </button>
    </form>
  </div>
</div>
