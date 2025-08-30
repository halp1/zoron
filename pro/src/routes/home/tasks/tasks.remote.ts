import { error } from "@sveltejs/kit";

import { command, getRequestEvent, query } from "$app/server";

import { aspen } from "@zoron/common/aspen";
import { adapter } from "@zoron/common/auth";

import type { User } from "@auth/sveltekit";

import * as v from "valibot";

// Types for our task system
export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  type: "class" | "custom";
  classId?: string;
  tasks: Task[];
  order: number;
}

// Validation schemas
const TaskSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1)),
  description: v.string(),
  date: v.string(),
  completed: v.boolean()
});

const TaskCategorySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  type: v.picklist(["class", "custom"]),
  classId: v.optional(v.string())
});

const TaskUpdateSchema = v.object({
  id: v.string(),
  title: v.optional(v.pipe(v.string(), v.minLength(1))),
  description: v.optional(v.string()),
  date: v.optional(v.string()),
  completed: v.optional(v.boolean())
});

const CategoryUpdateSchema = v.object({
  id: v.string(),
  name: v.optional(v.pipe(v.string(), v.minLength(1)))
});

const TaskMoveSchema = v.object({
  taskId: v.string(),
  fromCategoryId: v.string(),
  toCategoryId: v.string(),
  newIndex: v.number()
});

// Generate unique IDs
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

// Helper function to get user and validate auth
async function getAuthenticatedUser() {
  const { locals } = getRequestEvent();
  const session = await locals.auth();
  if (!session?.user?.id) {
    error(401, "Unauthorized");
  }
  return session.user;
}

// Helper function to automatically create default categories from user's classes
async function createDefaultCategories(
  userId: string
): Promise<TaskCategory[]> {
  const { locals } = getRequestEvent();
  const session = await locals.auth();

  if (!session?.user?.aspen) {
    error(400, "No Aspen credentials found");
  }

  try {
    // Try to get classes using existing session
    let classes: aspen.Types.Class[] = [];

    try {
      if (session.user.session?.cookie) {
        classes = (await aspen.classes(session.user.session.cookie)).classes;
      } else {
        throw new Error("No cached session");
      }
    } catch {
      // Fall back to authenticating with stored credentials
      const cookies = getRequestEvent().cookies;
      const secret = cookies.get("secret");

      if (!secret) {
        error(400, "No authentication secret found");
      }

      const credentials = aspen.decrypt(secret, session.user.aspen);
      const aspenSession = await aspen.authenticate(
        credentials.username,
        credentials.password
      );

      // Update the user's session
      await adapter.updateUser!({
        id: userId,
        session: {
          cookie: aspenSession.cookie,
          token: aspenSession.token
        }
      } satisfies User as any);

      classes = (await aspen.classes(aspenSession.cookie)).classes;
    }

    // Create categories from classes
    const categories: TaskCategory[] = classes.map((cls, index) => ({
      id: cls.id,
      name: cls.name,
      type: "class" as const,
      classId: cls.id,
      tasks: [],
      order: index
    }));

    // Add an "Other" category
    categories.push({
      id: generateId(),
      name: "Other",
      type: "custom" as const,
      tasks: [],
      order: categories.length
    });

    // Save the categories to the user's tasks
    const userTasksFormat = categories.map((cat) => ({
      class: {
        id: cat.id,
        name: cat.name
      },
      tasks: []
    }));

    await adapter.updateUser!({
      id: userId,
      tasks: userTasksFormat
    } satisfies User as any);

    return categories;
  } catch (err) {
    console.error("Failed to create default categories:", err);
    // If we can't get classes, create just an "Other" category
    const fallbackCategory: TaskCategory = {
      id: generateId(),
      name: "Other",
      type: "custom" as const,
      tasks: [],
      order: 0
    };

    try {
      await adapter.updateUser!({
        id: userId,
        tasks: [
          {
            class: {
              id: fallbackCategory.id,
              name: fallbackCategory.name
            },
            tasks: []
          }
        ]
      } satisfies User as any);
    } catch (updateErr) {
      console.error("Failed to save fallback category:", updateErr);
    }

    return [fallbackCategory];
  }
}

// Helper function to get user's task categories
function getUserTaskCategories(user: User): TaskCategory[] {
  if (!user.tasks) return [];

  return user.tasks.map((taskGroup, index) => ({
    id: taskGroup.class.id,
    name: taskGroup.class.name,
    type: "class" as const,
    classId: taskGroup.class.id,
    tasks: taskGroup.tasks.map((task) => ({
      ...task,
      completed: (task as any).completed || false,
      createdAt: (task as any).createdAt || task.date,
      updatedAt: (task as any).updatedAt || task.date
    })),
    order: index
  }));
}

// Helper function to update user tasks in database
async function updateUserTasks(userId: string, categories: TaskCategory[]) {
  const userTasksFormat = categories.map((cat) => ({
    class: {
      id: cat.id,
      name: cat.name
    },
    tasks: cat.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      date: task.date,
      completed: task.completed,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }))
  }));

  await adapter.updateUser!({
    id: userId,
    tasks: userTasksFormat
  } satisfies User as any);
}

// Query to get all task categories
export const getTaskCategories = query(async (): Promise<TaskCategory[]> => {
  const user = await getAuthenticatedUser();
  let categories = getUserTaskCategories(user);

  // If user has no categories, automatically create them from classes
  if (categories.length === 0) {
    console.log(`Creating default categories for user ${user.id}`);
    categories = await createDefaultCategories(user.id!);
    console.log(
      `Created ${categories.length} default categories:`,
      categories.map((c) => c.name)
    );
  }

  return categories;
});

// Command to create a new task
export const createTask = command(
  v.object({
    categoryId: v.string(),
    task: TaskSchema
  }),
  async ({ categoryId, task }) => {
    const user = await getAuthenticatedUser();
    const categories = getUserTaskCategories(user);

    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) {
      error(400, "Category not found");
    }

    const newTask: Task = {
      id: generateId(),
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    category.tasks.push(newTask);
    await updateUserTasks(user.id!, categories);

    await getTaskCategories().refresh();
    return newTask;
  }
);

// Command to update a task
export const updateTask = command(TaskUpdateSchema, async (taskUpdate) => {
  const user = await getAuthenticatedUser();
  const categories = getUserTaskCategories(user);

  let taskFound = false;
  for (const category of categories) {
    const taskIndex = category.tasks.findIndex((t) => t.id === taskUpdate.id);
    if (taskIndex !== -1) {
      category.tasks[taskIndex] = {
        ...category.tasks[taskIndex],
        ...Object.fromEntries(
          Object.entries(taskUpdate).filter(([_, value]) => value !== undefined)
        ),
        updatedAt: new Date().toISOString()
      };
      taskFound = true;
      break;
    }
  }

  if (!taskFound) {
    error(404, "Task not found");
  }

  await updateUserTasks(user.id!, categories);
  await getTaskCategories().refresh();
});

// Command to delete a task
export const deleteTask = command(v.string(), async (taskId) => {
  const user = await getAuthenticatedUser();
  const categories = getUserTaskCategories(user);

  let taskFound = false;
  for (const category of categories) {
    const taskIndex = category.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      category.tasks.splice(taskIndex, 1);
      taskFound = true;
      break;
    }
  }

  if (!taskFound) {
    error(404, "Task not found");
  }

  await updateUserTasks(user.id!, categories);
  await getTaskCategories().refresh();
});

// Command to create a new custom category
export const createCategory = command(
  TaskCategorySchema,
  async (categoryData) => {
    const user = await getAuthenticatedUser();
    const categories = getUserTaskCategories(user);

    const newCategory: TaskCategory = {
      id: generateId(),
      ...categoryData,
      tasks: [],
      order: categories.length
    };

    categories.push(newCategory);
    await updateUserTasks(user.id!, categories);

    await getTaskCategories().refresh();
    return newCategory;
  }
);

// Command to update a category
export const updateCategory = command(
  CategoryUpdateSchema,
  async (categoryUpdate) => {
    const user = await getAuthenticatedUser();
    const categories = getUserTaskCategories(user);

    const categoryIndex = categories.findIndex(
      (cat) => cat.id === categoryUpdate.id
    );
    if (categoryIndex === -1) {
      error(404, "Category not found");
    }

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      ...Object.fromEntries(
        Object.entries(categoryUpdate).filter(
          ([_, value]) => value !== undefined
        )
      )
    };

    await updateUserTasks(user.id!, categories);
    await getTaskCategories().refresh();
  }
);

// Command to delete a custom category
export const deleteCategory = command(v.string(), async (categoryId) => {
  const user = await getAuthenticatedUser();
  const categories = getUserTaskCategories(user);

  const categoryIndex = categories.findIndex((cat) => cat.id === categoryId);
  if (categoryIndex === -1) {
    error(404, "Category not found");
  }

  const category = categories[categoryIndex];
  if (category.type === "class") {
    error(400, "Cannot delete class categories");
  }

  categories.splice(categoryIndex, 1);
  await updateUserTasks(user.id!, categories);

  await getTaskCategories().refresh();
});

// Command to move a task between categories
export const moveTask = command(
  TaskMoveSchema,
  async ({ taskId, fromCategoryId, toCategoryId, newIndex }) => {
    const user = await getAuthenticatedUser();
    const categories = getUserTaskCategories(user);

    const fromCategory = categories.find((cat) => cat.id === fromCategoryId);
    const toCategory = categories.find((cat) => cat.id === toCategoryId);

    if (!fromCategory || !toCategory) {
      error(400, "Category not found");
    }

    const taskIndex = fromCategory.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      error(404, "Task not found");
    }

    const task = fromCategory.tasks.splice(taskIndex, 1)[0];
    task.updatedAt = new Date().toISOString();

    toCategory.tasks.splice(newIndex, 0, task);

    await updateUserTasks(user.id!, categories);
    await getTaskCategories().refresh();
  }
);
