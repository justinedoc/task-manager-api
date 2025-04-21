import type { Variables } from "@/types/hono-types.js";
import type { Context, Next } from "hono";
import { UNAUTHORIZED } from "stoker/http-status-codes";

export const adminProtected = async (
  c: Context<{ Variables: Variables }>,
  next: Next
) => {
  const user = c.get("user");

  if (user.role !== "ADMIN") {
    return c.json(
      {
        success: false,
        message: "Unauthorized",
      },
      UNAUTHORIZED
    );
  }

  await next();
};
