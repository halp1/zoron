<script lang="ts">
  import { page } from "$app/stores";
  const name = $page.data.session?.user?.name;
</script>

<svelte:head>
	<title>Home | A+spen</title>
</svelte:head>

<div>
  Hello, {name?.split(" ")[0]}.
</div>
