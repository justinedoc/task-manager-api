import { model } from "mongoose";
import { UserSchema, type IUser } from "@/schemas/user-schema.js";

const User = model<IUser>("user", UserSchema);

export default User;
