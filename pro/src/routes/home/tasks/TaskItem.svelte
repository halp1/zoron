<script lang="ts">
  import { theme } from "@zoron/common/web";

  import { useSortable } from "@dnd-kit-svelte/sortable";
  import { CSS, styleObjectToString } from "@dnd-kit-svelte/utilities";

  import type { Task } from "./tasks.remote";

  interface Props {
    task: Task;
    categoryId: string;
    onDelete: (taskId: string) => void;
    onToggleComplete: (taskId: string, completed: boolean) => void;
  }

  let { task, categoryId, onDelete, onToggleComplete }: Props = $props();

  const {
    attributes,
    listeners,
    isDragging,
    isSorting,
    node,
    transform,
    transition
  } = useSortable({
    id: task.id,
    data: {
      type: "task"
    }
  });

  const style = $derived(
    styleObjectToString({
      transform: CSS.Transform.toString(transform.current),
      transition: isSorting.current ? transition.current : undefined,
      zIndex: isDragging.current ? 1 : undefined
    })
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };
</script>

<div class="relative select-none" bind:this={node.current} {style}>
  <!-- Original element - becomes invisible during drag but maintains dimensions -->
  <div
    class="group rounded-lg border-2 p-4 shadow-sm transition-all duration-200 {$theme ===
    'amoled'
      ? 'border-gray-700 bg-black/90 hover:bg-gray-800/50'
      : 'border-gray-600 bg-slate-800/90 hover:bg-slate-700/50'} {task.completed
      ? 'opacity-60'
      : ''} {isDragging.current ? 'invisible' : ''}"
    {...attributes.current}
    {...listeners.current}
    style="touch-action: none;"
  >
    <!-- Task completion checkbox -->
    <div class="absolute left-2 top-2">
      <input
        type="checkbox"
        checked={task.completed}
        onchange={(e) => onToggleComplete(task.id, e.currentTarget.checked)}
        onpointerdown={(e) => e.stopPropagation()}
        onmousedown={(e) => e.stopPropagation()}
        class="h-4 w-4 rounded border-2 {$theme === 'amoled'
          ? 'border-white'
          : 'border-gray-400'} bg-transparent focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Task content -->
    <div class="ml-6">
      <!-- Title and actions -->
      <div class="mb-2 flex items-start justify-between gap-2">
        <h3
          class="font-semibold {$theme === 'amoled'
            ? 'text-white'
            : 'text-gray-100'} {task.completed ? 'line-through' : ''}"
        >
          {task.title}
        </h3>

        <!-- Action buttons (hidden unless hovering) -->
        <div
          class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <button
            onclick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            onpointerdown={(e) => e.stopPropagation()}
            onmousedown={(e) => e.stopPropagation()}
            class="rounded p-1 text-red-400 transition-colors hover:bg-red-600 hover:text-white"
            title="Delete task"
            aria-label="Delete task: {task.title}"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Description -->
      {#if task.description}
        <p
          class="text-sm {$theme === 'amoled'
            ? 'text-gray-400'
            : 'text-gray-300'} task-description mb-3"
        >
          {task.description}
        </p>
      {/if}

      <!-- Task metadata -->
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-3">
          <!-- Due date -->
          {#if task.date}
            <span
              class="flex items-center gap-1 {$theme === 'amoled'
                ? 'text-gray-400'
                : 'text-gray-500'}"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"
                />
              </svg>
              {formatDate(task.date)}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Drag placeholder -->
    {#if isDragging.current}
      <div class="absolute inset-0 flex items-center justify-center">
        <div
          class="h-full w-full {$theme === 'amoled'
            ? 'border-white bg-white/10'
            : 'border-gray-400 bg-gray-200/10'} flex items-center justify-center rounded-lg border-2 border-dashed"
        >
          <span
            class="text-xs {$theme === 'amoled'
              ? 'text-white'
              : 'text-gray-600'}">Moving: {task.title}</span
          >
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .task-description {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
  }
</style>
