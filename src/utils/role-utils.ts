import Admin from "@/models/admin-model.js";
import User from "@/models/user-model.js";
import type { IAdminDoc } from "@/types/admin-types.js";
import type { IUserDoc } from "@/types/user-type.js";
import type { Model } from "mongoose";

export type Roles = "USER" | "ADMIN";

type AllModels = IUserDoc | IAdminDoc;

export type RoleConfig<T extends string, K> = {
  [P in T]: Model<Extract<K, { role: P }>>;
};

export const roleModelMap: RoleConfig<Roles, AllModels> = {
  USER: User,
  ADMIN: Admin,
};

export const selectModel = (role: Roles) =>
  roleModelMap[role] as Model<AllModels>;
