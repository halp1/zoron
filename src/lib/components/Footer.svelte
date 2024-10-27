<script lang="ts">
  export let fixed = false;
</script>

<div
  class="{fixed
    ? 'fixed bottom-0 left-0'
    : 'relative'} flex w-screen flex-wrap items-center gap-3 bg-slate-800 p-3"
>
  <div class="w-full sm:w-auto">Copyright &copy; Joshua Liu {new Date().getFullYear()}</div>
  <div class="sm:ml-auto">
    <a href="/privacy" class="underline">Privacy</a>
    |
    <a href="/tos" class="underline"> Terms of service </a>
  </div>
</div>
