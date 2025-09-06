<script lang="ts">
  import { theme } from "@zoron/common/web";

  import {
    type Active,
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    DragOverlay,
    type DragStartEvent,
    MouseSensor,
    type Over,
    TouchSensor,
    useSensor,
    useSensors
  } from "@dnd-kit-svelte/core";
  import { SortableContext, arrayMove } from "@dnd-kit-svelte/sortable";

  import CategoryModal from "./CategoryModal.svelte";
  import TaskCategory from "./TaskCategory.svelte";
  import TaskItem from "./TaskItem.svelte";
  import {
    type Task,
    type TaskCategory as TaskCategoryType,
    createCategory,
    createTask,
    deleteCategory,
    deleteTask,
    getTaskCategories,
    moveTask,
    updateCategory,
    updateTask
  } from "./tasks.remote";

  // Initialize sensors for drag and drop (simplified like the working example)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 3
      }
    })
  );

  // Reactive queries
  const categoriesQuery = getTaskCategories();

  // State management (following new example pattern)
  let categories = $state<TaskCategoryType[]>([]);
  let activeItem = $state<Task | TaskCategoryType | null>(null);
  let activeType = $state<"task" | "category" | null>(null); // Modal states
  let categoryModalOpen = $state(false);
  let editingCategory = $state<TaskCategoryType | null>(null);

  // Load data
  $effect(() => {
    categoriesQuery.then((data) => {
      categories = data || [];
    });
  });

  // Helper function to get tomorrow's date
  function getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  // Type guards (following new example pattern)
  function isCategory(
    item: Task | TaskCategoryType | null
  ): item is TaskCategoryType {
    return item !== null && "tasks" in item;
  }

  function isTask(item: Task | TaskCategoryType | null): item is Task {
    return item !== null && "title" in item;
  }

  // Helper functions from new example
  function findCategory(id: string): TaskCategoryType | null {
    const categoryIndex = categories.findIndex(
      (category) =>
        category.id === id ||
        category.tasks.some((task) => task.id === id) ||
        id.includes(category.id + "-add-zone") ||
        id.includes(category.id + "-droppable")
    );
    return categoryIndex !== -1 ? categories[categoryIndex] : null;
  }

  function getTypeAndAccepts(active: Active, over: Over) {
    const activeType = active.data?.type as "category" | "task";
    const overType = over?.data?.type as
      | "category"
      | "task"
      | "category-drop"
      | undefined;
    const acceptsTask = over?.data?.accepts?.includes("task") ?? false;
    const acceptsCategory = over?.data?.accepts?.includes("category") ?? false;
    return { activeType, overType, acceptsTask, acceptsCategory };
  }

  // Drag handlers following new example pattern
  function handleDragStart({ active }: DragStartEvent) {
    const category = findCategory(active.id as string);
    activeType = active.data?.type as "category" | "task";

    if (active.data?.type === "category") {
      activeItem = category ?? null;
    } else {
      activeItem =
        category?.tasks.find((task) => task.id === active.id) ?? null;
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over) {
      activeItem = null;
      activeType = null;
      return;
    }

    // Handle moving tasks between categories (like done/in-progress in example)
    const activeTask = categories
      .flatMap((cat) => cat.tasks)
      .find((task) => task.id === active.id);

    if (activeTask) {
      // Find which category the task is being dropped into
      const targetCategory = categories.find(
        (cat) =>
          cat.id === over.id || // Direct drop on category
          cat.id.includes(over.id.toString().split("-droppable")[0]) || // Drop on droppable area
          over.id.toString().includes(cat.id + "-add-zone") // Drop on add zone
      );

      if (targetCategory) {
        const currentCategoryId = categories.find((cat) =>
          cat.tasks.some((task) => task.id === activeTask.id)
        )?.id;

        if (currentCategoryId && currentCategoryId !== targetCategory.id) {
          // Move task to different category
          moveTask({
            taskId: activeTask.id,
            fromCategoryId: currentCategoryId,
            toCategoryId: targetCategory.id,
            newIndex: targetCategory.tasks.length
          }).then(() => {
            categoriesQuery.then((data) => {
              categories = data || [];
            });
          });
        }
      }

      // Handle task reordering within same category
      const overTask = categories
        .flatMap((cat) => cat.tasks)
        .find((task) => task.id === over.id);

      if (
        (overTask && activeTask.id !== overTask.id) ||
        over.id.toString().includes("-add-zone")
      ) {
        const category = categories.find(
          (cat) =>
            cat.tasks.some(
              (task) => task.id === activeTask.id || task.id === overTask?.id
            ) || over.id.toString().includes(cat.id + "-add-zone")
        );

        if (category) {
          const oldIndex = category.tasks.findIndex(
            (task) => task.id === activeTask.id
          );
          let newIndex = category.tasks.length; // Default to end if dropping on add-zone

          if (overTask) {
            newIndex = category.tasks.findIndex(
              (task) => task.id === overTask.id
            );
          }

          if (oldIndex !== -1) {
            category.tasks = arrayMove(category.tasks, oldIndex, newIndex);
            moveTask({
              taskId: activeTask.id,
              fromCategoryId: category.id,
              toCategoryId: category.id,
              newIndex
            }).then(() => {
              categoriesQuery.then((data) => {
                categories = data || [];
              });
            });
          }
        }
      }
    }

    // Handle category reordering
    const activeCategoryObj = categories.find((cat) => cat.id === active.id);
    const overCategory = categories.find((cat) => cat.id === over.id);

    if (
      activeCategoryObj &&
      overCategory &&
      activeCategoryObj.id !== overCategory.id
    ) {
      const oldIndex = categories.findIndex(
        (cat) => cat.id === activeCategoryObj.id
      );
      const newIndex = categories.findIndex(
        (cat) => cat.id === overCategory.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        categories = arrayMove(categories, oldIndex, newIndex);
      }
    }

    activeItem = null;
    activeType = null;
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;

    const activeTask = categories
      .flatMap((cat) => cat.tasks)
      .find((task) => task.id === active.id);

    if (!activeTask) return;

    // Handle task being dragged over different categories
    const targetCategory = categories.find(
      (cat) =>
        cat.id === over.id ||
        cat.id.includes(over.id.toString().split("-droppable")[0]) ||
        over.id.toString().includes(cat.id + "-add-zone")
    );

    if (targetCategory) {
      const currentCategory = categories.find((cat) =>
        cat.tasks.some((task) => task.id === activeTask.id)
      );

      if (currentCategory && currentCategory.id !== targetCategory.id) {
        // Temporarily move task for visual feedback
        const taskIndex = currentCategory.tasks.findIndex(
          (task) => task.id === activeTask.id
        );
        if (taskIndex !== -1) {
          currentCategory.tasks.splice(taskIndex, 1);
          targetCategory.tasks.push(activeTask);
        }
      }
    }
  } // Task management functions
  async function handleCreateTaskInline(categoryId: string, title: string) {
    if (!title.trim()) return;

    try {
      await createTask({
        categoryId,
        task: {
          title: title.trim(),
          description: "",
          date: getTomorrowDate(),
          completed: false
        }
      });
      await categoriesQuery.refresh();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  }

  async function handleCreateTask(taskData: Partial<Task>, categoryId: string) {
    try {
      await createTask({
        categoryId,
        task: taskData as any
      });
      await categoriesQuery.refresh();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(taskId);
      await categoriesQuery.refresh();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }

  async function handleToggleTaskComplete(taskId: string, completed: boolean) {
    try {
      await updateTask({ id: taskId, completed });
      await categoriesQuery.refresh();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }

  // Category management functions
  async function handleCreateCategory(categoryData: {
    name: string;
    type: "custom";
  }) {
    try {
      await createCategory(categoryData);
      await categoriesQuery.refresh();
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  }

  async function handleUpdateCategory(categoryData: {
    name: string;
    type: "custom";
  }) {
    if (!editingCategory) return;

    try {
      await updateCategory({
        id: editingCategory.id,
        name: categoryData.name
      });
      await categoriesQuery.refresh();
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (
      !confirm(
        "Are you sure you want to delete this category and all its tasks?"
      )
    )
      return;

    try {
      await deleteCategory(categoryId);
      await categoriesQuery.refresh();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  }

  // Modal handlers
  function openCategoryModal(category?: TaskCategoryType) {
    editingCategory = category || null;
    categoryModalOpen = true;
  }

  function closeCategoryModal() {
    categoryModalOpen = false;
    editingCategory = null;
  }
</script>

<div class="min-h-screen p-6">
  <!-- Header -->
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1
        class="text-4xl font-bold {$theme === 'amoled'
          ? 'text-white'
          : 'text-gray-100'} mb-2"
      >
        Task Management
      </h1>
      <p class="text-lg {$theme === 'amoled' ? 'text-white' : 'text-gray-500'}">
        Organize your assignments and projects
      </p>
    </div>

    <div class="flex gap-3">
      <button
        onclick={() => openCategoryModal()}
        class="flex items-center gap-2 rounded-lg border-2 px-4 py-2 {$theme ===
        'amoled'
          ? 'border-white text-white hover:bg-white hover:text-black'
          : 'border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white'} transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
        Add Category
      </button>
    </div>
  </div>

  <!-- Kanban Board -->
  <DndContext
    {sensors}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    onDragOver={handleDragOver}
  >
    <SortableContext items={categories.map((cat) => cat.id)}>
      {#if categories.length > 0}
        <div class="auto-fill-300 grid gap-6 pb-6">
          {#each categories as category (category.id)}
            <TaskCategory
              {category}
              onDeleteTask={handleDeleteTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onEditCategory={openCategoryModal}
              onDeleteCategory={handleDeleteCategory}
              onAddTaskInline={handleCreateTaskInline}
            />
          {/each}
        </div>
      {:else}
        <div
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            class="{$theme === 'amoled' ? 'text-white' : 'text-gray-500'} mb-4"
          >
            <path
              d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"
              fill="currentColor"
            />
          </svg>
          <h3
            class="text-2xl font-semibold {$theme === 'amoled'
              ? 'text-white'
              : 'text-gray-100'} mb-2"
          >
            No categories yet
          </h3>
          <p
            class="text-lg {$theme === 'amoled'
              ? 'text-white'
              : 'text-gray-500'} mb-6 max-w-md"
          >
            Create your first category to start organizing your tasks
          </p>
          <div class="flex gap-3">
            <button
              onclick={() => openCategoryModal()}
              class="rounded-lg px-6 py-3 {$theme === 'amoled'
                ? 'bg-white text-black hover:bg-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors"
            >
              Create Category
            </button>
          </div>
        </div>
      {/if}
    </SortableContext>

    <!-- Drag overlay -->
    <DragOverlay>
      {#if isTask(activeItem)}
        <TaskItem
          task={activeItem}
          categoryId=""
          onDelete={() => {}}
          onToggleComplete={() => {}}
        />
      {:else if isCategory(activeItem)}
        <TaskCategory
          category={activeItem}
          onDeleteTask={() => {}}
          onToggleTaskComplete={() => {}}
          onEditCategory={() => {}}
          onDeleteCategory={() => {}}
          onAddTaskInline={() => {}}
        />
      {/if}
    </DragOverlay>
  </DndContext>

  <!-- Modals -->
  <CategoryModal
    isOpen={categoryModalOpen}
    category={editingCategory}
    onClose={closeCategoryModal}
    onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
  />
</div>

<style>
  .auto-fill-300 {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  *,
  ::before,
  ::after {
    transition: none;
  }
</style>
