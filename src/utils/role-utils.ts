import User from "@/models/user-model.js";

export type Roles = "USER" | "ADMIN";

export const roleModelMap = {
  USER: User,
} as const;
