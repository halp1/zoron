<script lang="ts">
  export let items: {
    value: any;
    label: string;
  }[];
  export let value: any;
</script>

<div class="border-x-1px inline-flex overflow-clip rounded-xl border-2 border-slate-600">
  {#each items as item, idx}
    <button
      class="border-slate-600 p-1"
      class:border-l-2={idx !== 0}
      class:bg-blue-500={item.value === value}
      on:click={() => (value = item.value)}>{item.label}</button
    >
  {/each}
</div>
