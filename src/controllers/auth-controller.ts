import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { UserZodSchema } from "@/schemas/user-schema.js";
import userService from "@/services/user-service.js";
import logger from "@/utils/logger.js";
import { z } from "zod";
import { setRefreshCookie } from "@/configs/cookie-config.js";

const app = new Hono();

const UserLoginZodSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// register users
app.post("/register", zValidator("json", UserZodSchema), async (c) => {
  const userDetails = c.req.valid("json");

  try {
    const userExists = await userService.exists(userDetails.email);

    if (userExists) {
      return c.json(
        {
          success: false,
          message: "User with this email already exists",
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

    const updatedUser = await userService.updateRefreshToken(
      user._id,
      refreshToken
    );

    if (!updatedUser) {
      logger.error("Failed to update refresh token");
    }

    await setRefreshCookie(c, refreshToken);

    logger.trace(`User ${user.firstname} has been added to the database`);

    return c.json(
      {
        success: true,
        message: "Registration successful",
        data: user,
        accessToken,
      },
      201
    );
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : error,
      "An error occurred while registering user: "
    );

    return c.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      500
    );
  }
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
        401
      );
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return c.json(
        {
          success: false,
          message: "Incorrect credentials",
        },
        401
      );
    }

    const { accessToken, refreshToken } = await userService.getAuthTokens(
      user._id
    );

    await setRefreshCookie(c, refreshToken);

    logger.trace(`User ${user.firstname} has been logged in`);

    return c.json(
      {
        success: true,
        message: "Login Successful",
        data: user,
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
      500
    );
  }
});

export default app;
