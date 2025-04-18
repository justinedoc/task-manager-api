import bcrypt from "bcryptjs";

import { SALT_ROUNDS } from "@/constants/auth-constants.js";
import User from "@/models/user-model.js";
import type { IUser } from "@/schemas/user-schema.js";
import type { Types } from "mongoose";
import { generateAuthTokens } from "@/utils/token-utils.js";

class UserService {
  async exists(email: string) {
    return User.exists({ email });
  }

  async findByEmail(email: string) {
    return User.findOne({ email }).select("-refreshToken -comparePassword");
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async create(userDetails: Omit<IUser, "comparePassword" | "_id">) {
    return User.create(userDetails);
  }

  async getAuthTokens(id: Types.ObjectId) {
    return generateAuthTokens(id, "user");
  }

  async updateRefreshToken(userId: Types.ObjectId, refreshToken: string) {
    return User.findByIdAndUpdate(
      userId,
      { refreshToken },
      { runValidators: true, new: true }
    );
  }

  async clearRefreshToken(userId: Types.ObjectId) {
    return User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }
}

const userService = new UserService();

export default userService;
