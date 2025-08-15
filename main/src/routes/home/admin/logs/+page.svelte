<script lang="ts">
  import { onMount } from "svelte";

  import { page } from "$app/state";

  import Skeleton from "@zoron/common/components/Skeleton.svelte";
  import { requests, toast } from "@zoron/common/web";
  import { theme } from "@zoron/common/web/theme";

  type LogEntry = string;

  const chunkSize = 100;

  let logs = $state<LogEntry[]>([]);
  let next = $state(0);
  let isLoading = $state(false);
  let allLogsLoaded = $state(false);
  let initialLoadAttempted = $state(false);

  const fetchLogs = async () => {
    if (isLoading || allLogsLoaded) return;
    isLoading = true;

    try {
      const params = {
        start: next,
        size: chunkSize
      };

      const apiResponse = await requests.get<{ logs: string[] }>(
        "/api/admin/logs",
        params
      );

      if (apiResponse.success === true) {
        logs = [...logs, ...apiResponse.data.logs.reverse()];
        next += apiResponse.data.logs.length;
        if (apiResponse.data.logs.length < 100) {
          allLogsLoaded = true;
        }
      } else {
        toast.error(
          "Failed to load logs: " + (apiResponse.error || "Unknown error")
        );
        allLogsLoaded = true; // Stop trying if there's an error
      }
    } catch (error) {
      toast.error("An error occurred while fetching logs: " + String(error));
      allLogsLoaded = true; // Stop trying on exception
    } finally {
      isLoading = false;
      if (!initialLoadAttempted) initialLoadAttempted = true;
    }
  };

  onMount(() => {
    fetchLogs();

    // idk causes crash
    // const eventSource = new EventSource('/api/admin/logs/stream');
    // eventSource.onmessage = (event) => {
    // 	const newLog = JSON.parse(event.data);
    // 	if (newLog) {
    // 		logs = [newLog, ...logs];
    // 		next += 1; // Increment next for each new log
    // 	}
    // };
    // eventSource.onerror = (error) => {
    // 	console.error("EventSource error:", error);
    // 	eventSource.close(); // Close the connection on error
    // 	history.go(0);
    // };

    // return () => {
    // 	eventSource.close(); // Clean up on component unmount
    // };
  });

  let sentinelElement = $state<HTMLDivElement | undefined>(undefined);

  $effect(() => {
    if (!sentinelElement || typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !allLogsLoaded) {
          fetchLogs();
        }
      },
      { threshold: 0.1 }
    ); // Trigger when 10% of sentinel is visible

    observer.observe(sentinelElement);

    return () => {
      if (sentinelElement) {
        // Ensure element still exists for unobserve
        observer.unobserve(sentinelElement);
      }
      observer.disconnect();
    };
  });
</script>

<svelte:head>
  <title>Admin Logs | {page.data?.env?.name || "Application"}</title>
</svelte:head>

<div class="text-white">
  <div class="container mx-auto px-4 pb-10 pt-10">
    <h1 class="mb-6 text-3xl font-semibold">Admin Logs</h1>

    {#if !initialLoadAttempted && isLoading}
      <!-- Initial loading skeletons -->
      <div class="space-y-2">
        {#each Array(10) as _}
          <Skeleton class="h-6 w-full rounded" />
        {/each}
      </div>
    {:else if logs.length === 0 && initialLoadAttempted}
      <!-- No logs found after initial attempt -->
      <p
        class="py-10 text-center {$theme === 'amoled'
          ? 'text-gray-400'
          : 'text-gray-600'}"
      >
        No logs found.
      </p>
    {/if}

    {#if logs.length > 0}
      <div
        class="space-y-1 rounded-md border-2 {$theme === 'amoled'
          ? 'border-white bg-black/50'
          : 'border-gray-300 bg-slate-800/50'} p-3 font-mono text-sm"
      >
        {#each logs as log, i (i)}
          <!-- Using index as key, assuming logs are appended only -->
          <div
            class="whitespace-pre-wrap rounded p-1.5 {$theme === 'amoled'
              ? 'hover:bg-gray-900'
              : 'hover:bg-slate-700'}"
          >
            {log}
          </div>
        {/each}
      </div>
    {/if}

    {#if isLoading && initialLoadAttempted && logs.length > 0}
      <!-- Loading more logs indicator -->
      <div class="mt-6 flex justify-center">
        <Skeleton class="h-8 w-32 rounded" />
      </div>
    {/if}

    {#if !allLogsLoaded && initialLoadAttempted && logs.length > 0}
      <!-- Sentinel for IntersectionObserver -->
      <div bind:this={sentinelElement} class="h-10 w-full"></div>
    {/if}

    {#if allLogsLoaded && initialLoadAttempted && logs.length > 0}
      <p
        class="mt-6 text-center text-sm {$theme === 'amoled'
          ? 'text-gray-500'
          : 'text-gray-400'}"
      >
        All logs loaded.
      </p>
    {/if}
  </div>
</div>

<style>
  .container {
    max-width: 1200px; /* Consistent max-width for content area */
  }
</style>
