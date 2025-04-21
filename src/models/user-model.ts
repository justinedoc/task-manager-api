import { model } from "mongoose";
import bcrypt from "bcryptjs";
import { UserSchema, type IUser } from "@/schemas/user-schema.js";

UserSchema.methods.comparePassword = async function (
  this: IUser,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.getFullname = async function (this: IUser) {
  return `${this.firstname} ${this.lastname}`;
};

const User = model<IUser>("User", UserSchema);

export default User;
