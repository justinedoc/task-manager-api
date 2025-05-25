export const TASK_CACHE_PREFIX = "task";
export const TASKS_CACHE_PREFIX = (id: string) => `tasks:${id}`;

export const USER_CACHE_PREFIX = "user";
export const USERS_CACHE_PREFIX = `users`;


export const ADMIN_CACHE_PREFIX = "admin";
export const ADMINS_CACHE_PREFIX = `admins`;

export const TASK_CACHE_TTL = 600; // 10 minutes
