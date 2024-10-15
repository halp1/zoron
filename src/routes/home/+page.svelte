<script lang="ts">
  import { page } from "$app/stores";
  const name = $page.data.session?.user?.name;
</script>

<div>
  Hello, {name?.split(" ")[0]}.
</div>
