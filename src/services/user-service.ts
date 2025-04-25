import bcrypt from "bcryptjs";
import { SALT_ROUNDS } from "@/constants/auth-constants.js";
import User from "@/models/user-model.js";
import type { Types } from "mongoose";
import { generateAuthTokens, verifyRefreshToken } from "@/utils/token-utils.js";
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

  async findByEmail(email: string) {
    return User.findOne({ email }).select("-refreshToken -comparePassword");
  }

  async getById(id: string) {
    const user = await User.findById(id).select(
      "-refreshToken -comparePassword -password -__v"
    );

    if (!user) throw new AuthError("User not found", NOT_FOUND);
    return user;
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
    const user = await User.findByIdAndDelete(id, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken -__v");

    if (!user)
      throw new AuthError(
        "User not found or user already deleted",
        BAD_REQUEST
      );

    return user;
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async getAuthTokens(id: Types.ObjectId) {
    return generateAuthTokens(id, "USER");
  }

  async getByIdAndRefreshToken(id: string, token: string) {
    return User.findOne({ _id: id, refreshToken: token }).select(
      "-refreshToken -comparePassword"
    );
  }

  async updateRefreshToken(userId: Types.ObjectId, refreshToken: string) {
    return User.findByIdAndUpdate(
      userId,
      { $addToSet: { refreshToken } },
      { runValidators: true, new: true }
    );
  }

  async clearRefreshToken(userId: string, refreshToken: string) {
    return User.findByIdAndUpdate(userId, { $unset: { refreshToken } });
  }

  async refreshAuth(oldToken: string) {
    const decoded = await verifyRefreshToken(oldToken);
    if (!decoded) throw new AuthError("Invalid refresh token");

    const user = await userService.getByIdAndRefreshToken(decoded.id, oldToken);
    if (!user) {
      this.clearRefreshToken(decoded.id, oldToken);
      throw new AuthError("Invalid refresh token");
    }

    const { accessToken, refreshToken } = await userService.getAuthTokens(
      user._id
    );

    await userService.updateRefreshToken(user._id, refreshToken);

    return { accessToken, refreshToken };
  }
}

const userService = new UserService();

export default userService;
