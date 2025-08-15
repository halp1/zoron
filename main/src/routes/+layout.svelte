<script lang="ts">
  import { Root } from "@zoron/common/components";

  import "@zoron/common/css/app.css";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();
</script>

<Root>
  {@render children?.()}
</Root>
