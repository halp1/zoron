<script lang="ts">
  import { theme } from "@zoron/common/web";

  import type { TaskCategory } from "./tasks.remote";

  interface Props {
    isOpen: boolean;
    category?: TaskCategory | null;
    onClose: () => void;
    onSave: (categoryData: { name: string; type: "custom" }) => void;
  }

  let { isOpen, category = null, onClose, onSave }: Props = $props();

  let formData = $state({
    name: ""
  });

  // Reset form when opening/closing or changing category
  $effect(() => {
    if (isOpen) {
      if (category) {
        formData = {
          name: category.name
        };
      } else {
        formData = {
          name: ""
        };
      }
    }
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      name: formData.name,
      type: "custom"
    });
    onClose();
  }

  function handleBackdropClick(e: Event) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 {$theme ===
    'amoled'
      ? 'bg-black/80'
      : 'bg-gray-900/80'} backdrop-blur-sm"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === "Escape" && handleBackdropClick(e)}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="w-full max-w-md rounded-xl border-2 p-6 {$theme === 'amoled'
        ? 'border-white bg-black'
        : 'border-gray-600 bg-slate-800'} shadow-2xl"
    >
      <h2
        class="mb-6 text-2xl font-bold {$theme === 'amoled'
          ? 'text-white'
          : 'text-gray-100'}"
      >
        {category ? "Edit Category" : "Create New Category"}
      </h2>

      <form onsubmit={handleSubmit} class="space-y-4">
        <!-- Category Name -->
        <div>
          <label
            for="category-name"
            class="mb-2 block text-sm font-medium {$theme === 'amoled'
              ? 'text-gray-300'
              : 'text-gray-400'}"
          >
            Category Name
          </label>
          <input
            id="category-name"
            type="text"
            bind:value={formData.name}
            placeholder="Enter category name..."
            required
            class="w-full rounded-lg border-2 px-3 py-2 {$theme === 'amoled'
              ? 'border-white bg-black text-white placeholder-gray-500 focus:ring-white'
              : 'border-gray-600 bg-slate-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500'} focus:border-transparent focus:outline-none focus:ring-2"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onclick={onClose}
            class="rounded-lg border-2 px-4 py-2 {$theme === 'amoled'
              ? 'border-white text-white hover:bg-white hover:text-black'
              : 'border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white'} transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="rounded-lg px-4 py-2 {$theme === 'amoled'
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors"
          >
            {category ? "Update Category" : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
