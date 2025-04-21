import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import userService from "@/services/user-service.js";
import logger from "@/utils/logger.js";
import { setRefreshCookie } from "@/configs/cookie-config.js";
import {
  CONFLICT,
  CREATED,
  INTERNAL_SERVER_ERROR,
  OK,
  UNAUTHORIZED,
} from "stoker/http-status-codes";
import { formatAuthSuccessResponse } from "@/utils/formatAuthResponse.js";
import { UserLoginZodSchema, UserZodSchema } from "@/schemas/user-schema.js";

const app = new Hono();

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
        CONFLICT
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

    logger.info(`User ${user.firstname} has been added to the database`);

    return c.json(
      {
        ...formatAuthSuccessResponse("Registration successful", user),
        accessToken,
      },
      CREATED
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
      INTERNAL_SERVER_ERROR
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

    const updatedUser = await userService.updateRefreshToken(
      user._id,
      refreshToken
    );

    if (!updatedUser) {
      return c.json(
        {
          success: false,
          message: "An error occurred while logging in",
        },
        INTERNAL_SERVER_ERROR
      );
    }

    await setRefreshCookie(c, refreshToken);

    logger.info(`User ${await user.getFullname()} has been logged in`);

    return c.json(
      {
        ...formatAuthSuccessResponse("Login Successful", user),
        accessToken,
      },
      OK
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
