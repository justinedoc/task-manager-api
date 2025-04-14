import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { UserZodSchema } from "@/schemas/user-schema.js";
import userService from "@/services/user-service.js";
import logger from "@/utils/logger.js";
import { setSignedCookie } from "hono/cookie";
import { ENV } from "@/configs/env-config.js";

const app = new Hono();

app.get("/register", zValidator("json", UserZodSchema), async (c) => {
  const userDetails = c.req.valid("json");

  try {
    const userExists = await userService.exists(userDetails.email);

    if (userExists) {
      return c.json(
        {
          success: false,
          message: "User with email already exists",
        },
        409
      );
    }

    const hashedPassword = await userService.hashPassword(userDetails.password);

    const user = await userService.create({
      ...userDetails,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = await userService.getAuthTokens(
      user._id
    );

    await userService.updateRefreshToken(user._id, refreshToken);

    await setSignedCookie(c, "session", refreshToken, ENV.COOKIE_SECRET);

    return c.json(
      {
        success: true,
        message: "Registeration successful",
        data: user,
        accessToken,
      },
      201
    );
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : error,
      "An error occured while registering user: "
    );

    return c.json({ message: "An unexpected error occured" }, 500);
  }
});

export default app;
