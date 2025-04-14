import type { Roles } from "@/utils/role-utils.js";
import type { Types } from "mongoose";
import { sign } from "hono/jwt";
import { ENV } from "@/configs/env-config.js";
import { ACCESS_TOKEN_EXP, REFRESH_TOKEN_EXP } from "@/constants/auth-constants.js";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function generateAuthTokens(
  id: Types.ObjectId,
  role: Roles
): Promise<AuthTokens> {


  const accessPayload = { id: id.toString(), role, exp: ACCESS_TOKEN_EXP };
  const refreshPayload = { ...accessPayload, exp: REFRESH_TOKEN_EXP };

  const accessToken = await sign(accessPayload, ENV.ACCESS_TOKEN_SECRET);
  const refreshToken = await sign(refreshPayload, ENV.REFRESH_TOKEN_SECRET);

  return { accessToken, refreshToken };
}
