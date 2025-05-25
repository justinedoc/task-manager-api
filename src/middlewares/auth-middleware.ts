import type { Context, Next } from "hono";
import { verifyAccessToken } from "@/lib/token-utils.js";
import logger from "@/lib/logger.js";
import { JwtTokenExpired } from "hono/utils/jwt/types";
import { FORBIDDEN, UNAUTHORIZED } from "stoker/http-status-codes";
import { roleModelMap, type Roles } from "@/lib/role-utils.js";
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

    const key = decodedAccessToken.role as keyof typeof roleModelMap;

    const Model = roleModelMap[key];
    if (!Model) throw new AuthError("Unknown Role", FORBIDDEN);

    const exists = await Model.exists({ _id: decodedAccessToken.id });
    if (!exists) throw new AuthError("Forbidden", FORBIDDEN);

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
