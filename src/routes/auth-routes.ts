import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import userService from "@/services/user-service.js";
import logger from "@/utils/logger.js";
import { z } from "zod";
import { setRefreshCookie } from "@/configs/cookie-config.js";
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "stoker/http-status-codes";
import { formatAuthSuccessResponse } from "@/utils/formatAuthResponse.js";

const app = new Hono();

const UserLoginZodSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

//login users
app.post("/login", zValidator("json", UserLoginZodSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  try {
    const user = await userService.findByEmail(email);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "Incorrect credentials",
        },
        UNAUTHORIZED
      );
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return c.json(
        {
          success: false,
          message: "Incorrect credentials",
        },
        UNAUTHORIZED
      );
    }

    const { accessToken, refreshToken } = await userService.getAuthTokens(
      user._id
    );

    await setRefreshCookie(c, refreshToken);

    logger.trace(`User ${user.firstname} has been logged in`);

    return c.json(
      {
        ...formatAuthSuccessResponse("Login Successful", user),
        accessToken,
      },
      200
    );
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : error,
      "An error occurred while logging in user: "
    );

    return c.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      INTERNAL_SERVER_ERROR
    );
  }
});

export default app;
