<script lang="ts">
  import { theme } from "@zoron/common/web";

  import { useDroppable } from "@dnd-kit-svelte/core";
  import { SortableContext, useSortable } from "@dnd-kit-svelte/sortable";
  import { CSS, styleObjectToString } from "@dnd-kit-svelte/utilities";

  import TaskItem from "./TaskItem.svelte";
  import type { TaskCategory } from "./tasks.remote";

  interface Props {
    category: TaskCategory;
    onDeleteTask: (taskId: string) => void;
    onToggleTaskComplete: (taskId: string, completed: boolean) => void;
    onEditCategory: (category: TaskCategory) => void;
    onDeleteCategory: (categoryId: string) => void;
    onAddTaskInline: (categoryId: string, title: string) => void;
  }

  let {
    category,
    onDeleteTask,
    onToggleTaskComplete,
    onEditCategory,
    onDeleteCategory,
    onAddTaskInline
  }: Props = $props();

  const {
    attributes,
    listeners,
    isDragging,
    node,
    isSorting,
    transform,
    transition
  } = useSortable({
    id: category.id,
    data: {
      type: "category"
    }
  });

  const { setNodeRef: setDropNodeRef } = useDroppable({
    id: `${category.id}-droppable`,
    data: {
      type: "category-drop",
      accepts: ["task"]
    }
  });

  const style = $derived(
    styleObjectToString({
      transform: CSS.Transform.toString(transform.current),
      transition: isSorting.current ? transition.current : undefined,
      zIndex: isDragging.current ? 1 : undefined
    })
  );

  let newTaskTitle = $state("");

  const handleAddTaskSubmit = () => {
    if (newTaskTitle.trim()) {
      onAddTaskInline(category.id, newTaskTitle.trim());
      newTaskTitle = "";
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddTaskSubmit();
    } else if (event.key === "Escape") {
      newTaskTitle = "";
    }
  };
</script>

<div class="relative" bind:this={node.current} {style}>
  <!-- Original element - becomes invisible during drag but maintains dimensions -->
  <div
    class="flex flex-col rounded-xl border-2 transition-all duration-200 {$theme ===
    'amoled'
      ? 'border-gray-700 bg-black/90'
      : 'border-gray-600 bg-slate-800/90'} min-h-[300px] backdrop-blur-xl {isDragging.current
      ? 'invisible'
      : ''}"
    {...attributes.current}
    style="touch-action: none;"
  >
    <!-- Category Header -->
    <div
      class="flex items-center justify-between border-b-2 p-4 {$theme ===
      'amoled'
        ? 'border-gray-700'
        : 'border-gray-600'} cursor-grab active:cursor-grabbing"
      {...listeners.current}
    >
      <div class="flex items-center gap-3">
        <h2
          class="text-xl font-bold {$theme === 'amoled'
            ? 'text-white'
            : 'text-gray-100'}"
        >
          {category.name}
        </h2>
        <span
          class="rounded-full px-2 py-1 text-sm {$theme === 'amoled'
            ? 'bg-gray-800 text-gray-300'
            : 'bg-gray-700 text-gray-400'}"
        >
          {category.tasks.length}
        </span>
      </div>

      <div class="flex items-center gap-2">
        {#if category.type === "custom"}
          <button
            onclick={() => onEditCategory(category)}
            onpointerdown={(e) => e.stopPropagation()}
            onmousedown={(e) => e.stopPropagation()}
            class="rounded-full p-2 {$theme === 'amoled'
              ? 'text-white hover:bg-gray-700'
              : 'text-gray-300 hover:bg-gray-600'} transition-colors"
            title="Edit category"
            aria-label="Edit {category.name} category"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              />
            </svg>
          </button>

          <button
            onclick={() => onDeleteCategory(category.id)}
            onpointerdown={(e) => e.stopPropagation()}
            onmousedown={(e) => e.stopPropagation()}
            class="rounded-full p-2 text-red-400 transition-colors hover:bg-red-600 hover:text-white"
            title="Delete category"
            aria-label="Delete {category.name} category"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Tasks Container -->
    <div
      use:setDropNodeRef
      class="custom-scroll flex-1 space-y-3 overflow-y-auto p-4"
    >
      <SortableContext
        items={[
          ...category.tasks.map((task) => task.id),
          `${category.id}-add-zone`
        ]}
      >
        {#each category.tasks as task (task.id)}
          <TaskItem
            {task}
            categoryId={category.id}
            onDelete={onDeleteTask}
            onToggleComplete={onToggleTaskComplete}
          />
        {/each}

        <!-- Droppable Add Task Zone -->
        <div
          id="{category.id}-add-zone"
          class="mt-3 rounded-lg border-2 border-dashed p-3 {$theme === 'amoled'
            ? 'border-gray-600 bg-gray-800/50'
            : 'border-gray-500 bg-gray-700/50'} min-h-[60px] transition-colors"
        >
          <input
            bind:value={newTaskTitle}
            onkeydown={handleKeydown}
            placeholder="Add new task..."
            class="w-full bg-transparent text-sm {$theme === 'amoled'
              ? 'text-white placeholder-gray-400'
              : 'text-gray-100 placeholder-gray-400'} border-none outline-none"
          />
          {#if newTaskTitle.trim()}
            <div class="mt-2 flex items-center gap-2">
              <button
                onclick={handleAddTaskSubmit}
                class="rounded px-3 py-1 text-xs {$theme === 'amoled'
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-gray-200 text-gray-900 hover:bg-white'} transition-colors"
              >
                Add Task
              </button>
              <button
                onclick={() => {
                  newTaskTitle = "";
                }}
                class="rounded px-3 py-1 text-xs {$theme === 'amoled'
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-500 hover:bg-gray-600 hover:text-gray-200'} transition-colors"
              >
                Clear
              </button>
            </div>
          {/if}
        </div>
      </SortableContext>
    </div>

    <!-- Drag placeholder -->
    {#if isDragging.current}
      <div
        class="absolute inset-0 {$theme === 'amoled'
          ? 'border-white bg-white/10'
          : 'border-gray-400 bg-gray-200/10'} flex items-center justify-center rounded-xl border-2 border-dashed"
      >
        <span
          class="text-sm {$theme === 'amoled' ? 'text-white' : 'text-gray-600'}"
          >Moving: {category.name}</span
        >
      </div>
    {/if}
  </div>
</div>
