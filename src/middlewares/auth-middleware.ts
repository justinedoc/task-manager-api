import type { Context, Next } from "hono";
import { verifyAccessToken } from "@/utils/token-utils.js";
import logger from "@/utils/logger.js";
import { JwtTokenExpired } from "hono/utils/jwt/types";
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "stoker/http-status-codes";
import type { Roles } from "@/utils/role-utils.js";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { success: false, message: "Invalid Authorization Header" },
      403
    );
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const decodedAccessToken = await verifyAccessToken(accessToken);
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

    logger.error("Token verification failed:", err);
    return c.json(
      {
        success: false,
        message: "Authentication failed",
        error: err instanceof Error && err.message,
      },
      INTERNAL_SERVER_ERROR
    );
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
