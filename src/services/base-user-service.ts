import { SALT_ROUNDS } from "@/constants/auth-constants.js";
import { AuthError } from "@/errors/auth-error.js";
import type { Roles } from "@/utils/role-utils.js";
import { selectModel } from "@/utils/role-utils.js";
import { generateAuthTokens, verifyRefreshToken } from "@/utils/token-utils.js";
import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import { BAD_REQUEST, NOT_FOUND } from "stoker/http-status-codes";

const excludePrivateFields = "-refreshToken -comparePassword -password -__v";

export class BaseUserService {
  private model: ReturnType<typeof selectModel>;
  public role: Roles;

  constructor(role: Roles) {
    this.model = selectModel(role);
    this.role = role;
  }

  async exists(email: string) {
    return this.model.exists({ email });
  }

  // user queries

  async findByEmail(email: string) {
    const user = await this.model
      .findOne({ email })
      .select(excludePrivateFields);
    if (!user) throw new AuthError("Incorrect credentials");
    return user;
  }

  async findById(id: string) {
    const user = await this.model.findById(id).select(excludePrivateFields);

    if (!user) throw new AuthError("User not found", NOT_FOUND);
    return user;
  }

  // Password actions

  async hashPassword(password: string) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async updatePassword(id: string, hashedPassword: string) {
    const user = await this.model
      .findByIdAndUpdate(
        id,
        { password: hashedPassword },
        {
          new: true,
        }
      )
      .select(excludePrivateFields);

    if (!user) throw new AuthError("User not found", NOT_FOUND);
    return user;
  }

  async canResetPassword(id: string, oldPassword: string) {
    const user = await this.model
      .findById(id)
      .select("comparePassword password");

    if (!user) throw new AuthError("User not found", NOT_FOUND);

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) throw new AuthError("Incorrect credentials", BAD_REQUEST);

    return user;
  }

  // token actions

  async getAuthTokens(id: Types.ObjectId) {
    return generateAuthTokens(id, this.role);
  }

  async getByIdAndRefreshToken(id: string, token: string) {
    return this.model
      .findOne({ _id: id, refreshToken: token })
      .select(excludePrivateFields);
  }

  async updateRefreshToken(userId: Types.ObjectId, refreshToken: string) {
    return this.model.findByIdAndUpdate(
      userId,
      { $addToSet: { refreshToken } },
      { runValidators: true, new: true }
    );
  }

  async clearRefreshToken(userId: string, refreshToken: string) {
    return this.model.findByIdAndUpdate(userId, { $unset: { refreshToken } });
  }

  // refresh token func

  async refreshAuth(oldToken: string) {
    const decoded = await verifyRefreshToken(oldToken);
    if (!decoded) {
      throw new AuthError("Invalid refresh token, please login again");
    }

    const user = await this.getByIdAndRefreshToken(decoded.id, oldToken);

    if (!user) {
      this.clearRefreshToken(decoded.id, oldToken);
      throw new AuthError("Invalid refresh token");
    }

    const { accessToken, refreshToken } = await this.getAuthTokens(user._id);

    await this.updateRefreshToken(user._id, refreshToken);

    return { accessToken, refreshToken };
  }
}
