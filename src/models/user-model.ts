import { UserSchema, type IUser } from "@/schemas/user-schema.js";
import { model } from "mongoose";

const User = model<IUser>("user", UserSchema);

export default User;
