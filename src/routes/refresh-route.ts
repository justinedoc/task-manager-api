import { getRefreshCookie, setRefreshCookie } from "@/configs/cookie-config.js";
import userService from "@/services/user-service.js";
import type { AppBindings } from "@/types/hono-types.js";
import { AuthError } from "@/errors/auth-error.js";
import logger from "@/utils/logger.js";
import { Hono } from "hono";
import { INTERNAL_SERVER_ERROR, OK } from "stoker/http-status-codes";

const app = new Hono<AppBindings>().basePath("/refresh");

app.get("/", async (c) => {
  try {
    const cookie = await getRefreshCookie(c);

    if (!cookie) throw new AuthError("No token provided");

    const { accessToken, refreshToken } = await userService.refreshAuth(cookie);
    await setRefreshCookie(c, refreshToken);

    return c.json({ success: true, data: { accessToken } }, OK);
  } catch (err) {
    if (err instanceof AuthError) {
      logger.warn(err.message);
      return c.json({ success: false, message: err.message }, err.status);
    }

    logger.error(err, "Unexpected error in refresh");
    return c.json(
      { success: false, message: "An unexpected error occured" },
      INTERNAL_SERVER_ERROR
    );
  }
});

export default app;
