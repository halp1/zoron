<script lang="ts">
  import { supabase } from "$lib/supabase";
</script>

<div class="flex flex-grow flex-col items-center justify-center">
  <div class="text-4xl">Welcome to Zoron Chat.</div>
  {!!$supabase}
  {$supabase?.realtime?.isConnected()}
</div>
