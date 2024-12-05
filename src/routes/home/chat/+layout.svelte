<script lang="ts">
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
		import { page } from "$app/stores";

		onMount(() => {
			const client = supabase.connect($page.data.env.supabase.id, $page.data.env.supabase.key);
		});
</script>
<main>
	<div class="flex flex-col items-stretch h-full">
	<slot/>
	</div>
</main>