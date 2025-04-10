import { UserSchema, type IUser } from "@/schemas/user-schema.js";
import { model } from "mongoose";

export default model<IUser>("user", UserSchema);
