import User from "@/models/user-model.js";
import type { IUserLean } from "@/types/user-type.js";
import { AuthError } from "@/errors/auth-error.js";
import { BAD_REQUEST, NOT_FOUND } from "stoker/http-status-codes";

type IncomingUser = Omit<
  IUserLean,
  "comparePassword" | "getFullname" | "_id" | "tasks" | "refreshToken"
>;
class UserService {
  async create(userDetails: IncomingUser) {
    return User.create(userDetails);
  }

  async exists(email: string) {
    return User.exists({ email });
  }

  async getByIdAndUpdate(id: string, userDetails: Partial<IncomingUser>) {
    const user = await User.findByIdAndUpdate(id, userDetails, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken -__v");

    if (!user) throw new AuthError("User not found", NOT_FOUND);

    return user;
  }

  async deleteUser(id: string) {
    const user = await User.findOneAndDelete({ _id: id }).select(
      "-password -refreshToken -__v"
    );

    if (!user)
      throw new AuthError(
        "User not found or user already deleted",
        BAD_REQUEST
      );

    return user;
  }
}

const userService = new UserService();

export default userService;
