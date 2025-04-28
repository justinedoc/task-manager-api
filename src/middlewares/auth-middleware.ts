import type { Context, Next } from "hono";
import { verifyAccessToken } from "@/utils/token-utils.js";
import logger from "@/utils/logger.js";
import { JwtTokenExpired } from "hono/utils/jwt/types";
import { FORBIDDEN, UNAUTHORIZED } from "stoker/http-status-codes";
import type { Roles } from "@/utils/role-utils.js";
import { model } from "mongoose";
import { AuthError } from "@/errors/auth-error.js";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Invalid Authorization Header", FORBIDDEN);
  }
  
  const accessToken = authHeader.split(" ")[1];

  try {
    const decodedAccessToken = await verifyAccessToken(accessToken);

    if (!decodedAccessToken) throw new AuthError("Invalid - Token");

    const role =
      decodedAccessToken.role.charAt(0) +
      decodedAccessToken.role.slice(1).toLowerCase();

    if (!(await model(role).exists({ _id: decodedAccessToken.id }))) {
      throw new AuthError(
        "You are forbidden to perform this action",
        FORBIDDEN
      );
    }

    c.set("user", decodedAccessToken);
    logger.info("Access token verified successfully");
    await next();
  } catch (err) {
    if (err instanceof JwtTokenExpired) {
      logger.warn("Expired token detected");
      return c.json(
        { success: false, message: "Token expired", code: "TOKEN_EXPIRY" },
        UNAUTHORIZED
      );
    }

    throw err;
  }
}

interface isSelfOrAdminParams {
  userId: string;
  id: string;
  role: Roles;
}

export function isSelfOrAdmin({ userId, id, role }: isSelfOrAdminParams) {
  return userId === id || role === "ADMIN";
}
