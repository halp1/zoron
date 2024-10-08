<script>
  import { onMount } from "svelte";
  import { Toaster } from "svelte-french-toast";
  import "../app.css";

  onMount(() => {
    document.body.classList.add("suse");
  });
</script>

<Toaster />
<slot></slot>
