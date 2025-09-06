<script lang="ts">
  import { theme } from "@zoron/common/web";

  import type { Task, TaskCategory } from "./tasks.remote";

  interface Props {
    isOpen: boolean;
    task?: Task | null;
    categories: TaskCategory[];
    selectedCategoryId?: string;
    onClose: () => void;
    onSave: (taskData: Partial<Task>, categoryId: string) => void;
  }

  let {
    isOpen,
    task = null,
    categories,
    selectedCategoryId = "",
    onClose,
    onSave
  }: Props = $props();

  // Form data
  let formData = $state({
    title: "",
    description: "",
    date: "",
    categoryId: selectedCategoryId
  });

  // Reset form data when modal opens/closes or task changes
  $effect(() => {
    if (isOpen) {
      if (task) {
        // Edit mode - find which category this task belongs to
        formData.title = task.title;
        formData.description = task.description || "";
        formData.date = task.date || "";
        // Find the category that contains this task
        const taskCategory = categories.find((cat) =>
          cat.tasks.some((t) => t.id === task.id)
        );
        formData.categoryId = taskCategory?.id || selectedCategoryId;
      } else {
        // Create mode
        formData.title = "";
        formData.description = "";
        formData.date = "";
        formData.categoryId = selectedCategoryId;
      }
    }
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.categoryId) {
      return;
    }

    const taskData: Partial<Task> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      date: formData.date || undefined
    };

    onSave(taskData, formData.categoryId);
  };

  const handleClose = () => {
    onClose();
  };

  const handleBackdropClick = (e: Event) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 {$theme ===
    'amoled'
      ? 'bg-black'
      : 'bg-gray-900/80'} backdrop-blur-sm"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === "Escape" && handleBackdropClick(e)}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="w-full max-w-lg rounded-xl {$theme === 'amoled'
        ? 'border-white bg-black'
        : 'border-gray-700 bg-slate-800'} max-h-[90vh] overflow-y-auto border-2 shadow-2xl"
      role="document"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b-2 p-4 {$theme ===
        'amoled'
          ? 'border-white'
          : 'border-gray-700'}"
      >
        <h2
          class="text-xl font-bold {$theme === 'amoled'
            ? 'text-white'
            : 'text-gray-100'}"
        >
          {task ? "Edit Task" : "Create New Task"}
        </h2>
        <button
          onclick={handleClose}
          class="rounded-full p-2 {$theme === 'amoled'
            ? 'text-white hover:bg-white hover:text-black'
            : 'text-gray-400 hover:bg-gray-600'} transition-colors"
          aria-label="Close modal"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form onsubmit={handleSubmit} class="space-y-4 p-4">
        <!-- Category Selection -->
        <div>
          <label
            for="category-select"
            class="mb-2 block text-sm font-medium {$theme === 'amoled'
              ? 'text-white/80'
              : 'text-gray-400'}"
          >
            Category
          </label>
          <select
            id="category-select"
            bind:value={formData.categoryId}
            required
            class="w-full rounded-lg border-2 px-3 py-2 {$theme === 'amoled'
              ? 'border-white bg-black text-white focus:ring-white'
              : 'border-gray-600 bg-slate-700 text-gray-100 focus:ring-blue-500'} focus:border-transparent focus:ring-2 focus:outline-none"
          >
            <option value="">Select a category</option>
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>

        <!-- Task Title -->
        <div>
          <label
            for="task-title"
            class="mb-2 block text-sm font-medium {$theme === 'amoled'
              ? 'text-white'
              : 'text-gray-400'}"
          >
            Title
          </label>
          <input
            id="task-title"
            type="text"
            bind:value={formData.title}
            placeholder="Enter task title"
            required
            class="w-full rounded-lg border-2 px-3 py-2 {$theme === 'amoled'
              ? 'border-white bg-black text-white placeholder-white focus:ring-white'
              : 'border-gray-600 bg-slate-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500'} focus:border-transparent focus:ring-2 focus:outline-none"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            for="task-description"
            class="mb-2 block text-sm font-medium {$theme === 'amoled'
              ? 'text-white'
              : 'text-gray-400'}"
          >
            Description
          </label>
          <textarea
            id="task-description"
            bind:value={formData.description}
            placeholder="Enter task description (optional)"
            rows="3"
            class="w-full resize-none rounded-lg border-2 px-3 py-2 {$theme ===
            'amoled'
              ? 'border-white bg-black text-white placeholder-white focus:ring-white'
              : 'border-gray-600 bg-slate-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500'} focus:border-transparent focus:ring-2 focus:outline-none"
          ></textarea>
        </div>

        <!-- Due Date -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="task-due-date"
              class="mb-2 block text-sm font-medium {$theme === 'amoled'
                ? 'text-white'
                : 'text-gray-400'}"
            >
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              bind:value={formData.date}
              class="w-full rounded-lg border-2 px-3 py-2 {$theme === 'amoled'
                ? 'border-white bg-black text-white focus:ring-white'
                : 'border-gray-600 bg-slate-700 text-gray-100 focus:ring-blue-500'} focus:border-transparent focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onclick={handleClose}
            class="rounded-lg border-2 px-4 py-2 {$theme === 'amoled'
              ? 'border-white text-white hover:bg-white hover:text-black'
              : 'border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'} transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!formData.title.trim() || !formData.categoryId}
            class="rounded-lg border-2 px-4 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 {$theme ===
            'amoled'
              ? 'border-white bg-white text-black hover:bg-gray-100'
              : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'}"
          >
            {task ? "Update" : "Create"} Task
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
