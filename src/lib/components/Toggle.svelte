<script lang="ts">
  export let checked = false;
  export let color = "bg-orange-400";
</script>

<label class="flex cursor-pointer items-center">
  <div class="relative h-6 w-10 rounded-full bg-slate-600">
    <input type="checkbox" bind:checked class="peer hidden" />
    <div
      class="absolute left-[2px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full {color} transition-all peer-checked:left-[18px]"
    ></div>
  </div>
</label>
