import type { IUserLean } from "@/types/user-type.js";
import { BaseUserService } from "@/services/base-user-service.js";
import type { Roles } from "@/utils/role-utils.js";
import { BaseUserCrud } from "@/services/base-crud-service.js";

type IncomingUser = Omit<
  IUserLean,
  "comparePassword" | "getFullname" | "_id" | "tasks" | "refreshToken" | "role"
>;
class UserService extends BaseUserService {
  private crud: BaseUserCrud;

  constructor(role: Roles) {
    super(role);
    this.crud = new BaseUserCrud(this.model);
  }

  async create(userDetails: IncomingUser) {
    return this.crud.create(userDetails);
  }

  async update(id: string, userDetails: Partial<IncomingUser>) {
    return this.crud.update(id, userDetails);
  }

  async delete(id: string) {
    return this.crud.delete(id);
  }
}

const userService = new UserService("USER");

export default userService;
