import type { Roles } from "@/utils/role-utils.js";
import type { Types } from "mongoose";
import { sign } from "hono/jwt";
import { ENV } from "@/configs/env-config.js";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function generateAuthTokens(
  id: Types.ObjectId,
  role: Roles
): Promise<AuthTokens> {
  const accessExp = Math.floor(Date.now() / 1000) + 60 * 15;
  const refreshExp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;

  const accessPayload = { id: id.toString(), role, exp: accessExp };
  const refreshPayload = { ...accessPayload, exp: refreshExp };

  const accessToken = await sign(accessPayload, ENV.ACCESS_TOKEN_SECRET);
  const refreshToken = await sign(refreshPayload, ENV.REFRESH_TOKEN_SECRET);

  return { accessToken, refreshToken };
}
