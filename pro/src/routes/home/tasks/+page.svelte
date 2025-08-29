<script lang="ts">
  import { zoron } from "@zoron/common/web";
</script>

<div
  class="grid grid-cols-1 gap-5 px-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-16"
>
  {#each $zoron.classes as c}
    <div class="rounded-xl border-2 border-white p-4">
      <div class="text-2xl">{c.name}</div>
    </div>
  {/each}
</div>
