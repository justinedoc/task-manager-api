import { model } from "mongoose";
import bcrypt from "bcryptjs";
import { AdminSchema } from "@/schemas/admin-schema.js";
import type { IAdminDoc } from "@/types/admin-types.js";

AdminSchema.methods.comparePassword = async function (
  this: IAdminDoc,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

AdminSchema.methods.getFullname = async function (
  this: IAdminDoc
): Promise<string> {
  return `${this.firstname} ${this.lastname}`;
};

AdminSchema.pre("save", async function (next) {
  if (!this.username && this.email) {
    const base = this.email.split("@")[0];
    let candidate = base;
    let count = 1;

    while (await model<IAdminDoc>("Admin").exists({ username: candidate })) {
      candidate = `${base}${count++}`;
    }
    this.username = candidate;
  }

  next();
});

const Admin = model<IAdminDoc>("Admin", AdminSchema);

export default Admin;
